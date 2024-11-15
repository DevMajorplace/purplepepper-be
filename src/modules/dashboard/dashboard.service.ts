import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERROR_MESSAGE_INVALID_ROLE, ERROR_MESSAGE_PERMISSION_DENIED } from 'src/common/constants/error-messages';
import { Board } from '../boards/schemas/board.schema';
import { User } from '../users/schemas/user.schema';
import { ClientNumberResDto } from './dto/res/client.number.res.dto';
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

	// 하위 광고주 수 조회
	async getClientsCount(req: any): Promise<ClientNumberResDto> {
		const user = req.user;

		if (!user || !user.userId || !user.role) {
			throw new UnauthorizedException(ERROR_MESSAGE_PERMISSION_DENIED);
		}

		// 역할에 따른 필터 생성
		const filter = this.getFilterByRole(user.role, user.userId);

		// 필터에 맞는 client 수 조회
		const clientsCount = await this.userModel.countDocuments(filter).exec();
		return new ClientNumberResDto({ clientsCount });
	}
}
