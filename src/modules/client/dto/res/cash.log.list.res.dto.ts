import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';
import { CashLogResDto } from './cash.log.res.dto';

export class CashLogsListResDto {
	@IsNumber()
	@ApiProperty({ description: '현재 보유 캐시' })
	public readonly current_amount: number;

	@IsArray()
	@ApiProperty({ description: '캐시 로그 리스트', type: [CashLogResDto] })
	public readonly logs: CashLogResDto[];

	constructor(currentAmount: number, logs: any[], includeTitle: boolean = false) {
		this.current_amount = currentAmount;
		this.logs = logs.map(log => new CashLogResDto(log, includeTitle));
	}
}
