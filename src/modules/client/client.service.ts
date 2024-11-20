import { BadRequestException, Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERROR_MESSAGE_INVALID_AMOUNT } from 'src/common/constants/error-messages';
import { User } from '../user/schemas/user.schema';
import { ChargeCashReqDto } from './dto/req/charge.cash.req.dto';
import { ChargeCashResDto } from './dto/res/charge.cash.res.dto';
import { CashLog } from './schemas/cash-log.schema';
import { CashLogCategory, CashLogStatus, CashLogType } from './types/cash-log.enum';

@Injectable()
export class ClientService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(CashLog.name) private readonly cashLogModel: Model<CashLog>,
	) {}

	//캐시 충전
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
			type: CashLogType.ADD,
			category: CashLogCategory.CHARGE,
			depositor: depositor,
			amount: amount,
			status: CashLogStatus.PENDING,
		});

		return new ChargeCashResDto({ amount: cashLog.amount });
	}
}
