import { BadRequestException, Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERROR_MESSAGE_INVALID_AMOUNT } from 'src/common/constants/error-messages';
import { User } from '../user/schemas/user.schema';
import { ChargeCashReqDto } from './dto/req/charge.cash.req.dto';
import { CashLogsListResDto } from './dto/res/cash.log.list.res.dto';
import { ChargeCashResDto } from './dto/res/charge.cash.res.dto';
import { Advertisement } from './schemas/advertisement.schema';
import { CashLog } from './schemas/cash-log.schema';
import { CashLogCategory, CashLogStatus, CashLogType } from './types/cash-log.enum';

@Injectable()
export class ClientService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(CashLog.name) private readonly cashLogModel: Model<CashLog>,
		@InjectModel(Advertisement.name) private readonly advertisementModel: Model<Advertisement>,
	) {}

	// 캐시 충전
	async chargeCash(@Req() req: any, chargeCashReqDto: ChargeCashReqDto): Promise<ChargeCashResDto> {
		const userId = req.user.userId;

		const user = await this.userModel.findOne({ user_id: userId }).exec();

		const amount = chargeCashReqDto.amount;
		const depositor = chargeCashReqDto.depositor;

		// 충전 금액은 오만원 이상 천만원이하
		if (amount < 50000 || amount > 10000000) {
			throw new BadRequestException(ERROR_MESSAGE_INVALID_AMOUNT);
		}

		// 캐시로그 생성
		const cashLog = await this.cashLogModel.create({
			user_idx: user._id,
			type: CashLogType.DEPOSIT,
			category: CashLogCategory.DEPOSIT_PENDING,
			depositor: depositor,
			amount: amount,
			status: CashLogStatus.PENDING,
		});

		return new ChargeCashResDto({ amount: cashLog.amount });
	}

	// 캐시 이용/충전내역 조회
	async getCashLogs(req: any, pageType: 'usage' | 'deposit'): Promise<CashLogsListResDto> {
		const userId = req.user.userId;

		// 사용자 정보 가져오기
		const user = await this.userModel.findOne({ user_id: userId }).exec();
		if (!user) throw new Error('사용자를 찾을 수 없습니다.');

		const currentAmount = user.cash;

		// 캐시 로그 가져오기
		const cashLogs = await this.cashLogModel.find({ user_idx: user._id }).exec();

		// 페이지 타입에 따라 필터링
		const filteredLogs = this.filterLogsByPageType(cashLogs, pageType);

		// 광고 제목 추가 (이용 내역에만 해당)
		if (pageType === 'usage') {
			const advertisementIdxList = filteredLogs.map(log => log.advertisement_idx).filter(idx => !!idx);
			const advertisements = await this.advertisementModel.find({ objectId: { $in: advertisementIdxList } }).exec();

			const titlesMap = advertisements.reduce(
				(acc, ad) => {
					acc[ad.objectId] = ad.title;
					return acc;
				},
				{} as Record<number, string>,
			);

			filteredLogs.forEach(log => {
				if (log.advertisement_idx) {
					(log as any).advertisement_title = titlesMap[log.advertisement_idx] || null;
				}
			});
		}

		// DTO 생성 (페이지 타입에 따라 광고 제목 포함 여부 결정)
		return new CashLogsListResDto(currentAmount, filteredLogs, pageType === 'usage');
	}

	// 캐시 이용/충전 페이지 별 캐시로그타입 필터 함수 (더 나은 방향이 있는지 고민 필요)
	private filterLogsByPageType(cashLogs: any[], pageType: 'usage' | 'deposit') {
		if (pageType === 'usage') {
			// 사용 내역: 사용, 환급 등
			return cashLogs.filter(log => [CashLogType.USAGE, CashLogType.REFUND].includes(log.type));
		} else if (pageType === 'deposit') {
			// 충전 내역: 입금 대기, 입금 확인, 입금 기한 초과 등
			return cashLogs.filter(log =>
				[CashLogType.DEPOSIT, CashLogStatus.PENDING, CashLogStatus.APPROVED, CashLogStatus.REJECTED].includes(
					log.type || log.status,
				),
			);
		}
		return [];
	}
}
