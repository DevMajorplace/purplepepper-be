import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';
import { Model } from 'mongoose';
import { ERROR_MESSAGE_INVALID_ROLE, ERROR_MESSAGE_PERMISSION_DENIED } from 'src/common/constants/error-messages';
import { Board } from '../board/schemas/board.schema';
import { User } from '../user/schemas/user.schema';
import { ClientStatResDto } from './dto/res/client.number.res.dto';
import { NoticeResDto } from './dto/res/notice.res.dto';

@Injectable()
export class DashboardService {
	constructor(
		@InjectModel(Board.name) private readonly boardModel: Model<Board>,
		@InjectModel(User.name) private readonly userModel: Model<User>,
	) {}

	// 역할에 따른 필터링 함수
	private getFilterByRole(role: string, userId: string) {
		if (role === 'admin') {
			// admin은 모든 client를 조회
			return { role: 'client' };
		} else if (role === 'agency') {
			// agency는 본인이 추천인인 client만 조회
			return {
				role: 'client',
				parent_ids: { $in: [userId] },
			};
		} else {
			throw new ForbiddenException(ERROR_MESSAGE_INVALID_ROLE);
		}
	}

	// 특정 월의 데이터 카운트
	private async countForMonth(model: Model<any>, filter: any, date: Date): Promise<number> {
		// KST 기준으로 월의 시작과 끝 계산
		const startDate = moment.tz(date, 'Asia/Seoul').startOf('month').toDate(); // 이번 달 첫째 날 00:00:00 KST
		const endDate = moment.tz(date, 'Asia/Seoul').endOf('month').toDate(); // 이번 달 마지막 날 23:59:59.999 KST

		return model
			.countDocuments({
				...filter,
				is_active: true, // 사용하는 사용자만
				status: 'approved', // 승인된 사용자만
				approved_at: { $gte: startDate, $lt: endDate }, // 이번 달 범위
			})
			.exec();
	}

	// 증가율 계산
	private calculateGrowthRate(current: number, previous: number): number {
		if (previous === 0) return null;
		return ((current - previous) / previous) * 100;
	}

	// 지난 달 날짜 계산
	private getPreviousMonthDate(date: Date): Date {
		// KST 기준으로 현재 날짜에서 지난 달로 이동
		const previousMonth = moment.tz(date, 'Asia/Seoul').subtract(1, 'month');
		return previousMonth.startOf('month').toDate();
	}

	// 최신 공지사항 제목 조회
	async getLatestNoticeTitle(roles: string[]): Promise<NoticeResDto> {
		const latestNotice = await this.boardModel
			.findOne({
				visible: { $in: roles },
				deleted_at: null, // 삭제되지 않은 공지사항만 조회
			})
			.sort({ created_at: -1 })
			.exec();

		return new NoticeResDto({ title: latestNotice ? latestNotice.title : '' });
	}

	// 하위 광고주 수 통계 조회
	async getClientsStat(req: any): Promise<ClientStatResDto> {
		const user = req.user;

		if (!user || !user.userId || !user.role) {
			throw new UnauthorizedException(ERROR_MESSAGE_PERMISSION_DENIED);
		}

		// 역할에 따른 필터 생성
		const filter = this.getFilterByRole(user.role, user.userId);

		// 현재 날짜 기준으로 이번 달과 지난 달의 광고주 수 조회
		const currentMonthCount = await this.countForMonth(this.userModel, filter, new Date());
		const previousMonthCount = await this.countForMonth(this.userModel, filter, this.getPreviousMonthDate(new Date()));

		// 증가율 계산
		const growthRate = this.calculateGrowthRate(currentMonthCount, previousMonthCount);

		return new ClientStatResDto({
			clientsCount: currentMonthCount,
			growthRate,
		});
	}
}
