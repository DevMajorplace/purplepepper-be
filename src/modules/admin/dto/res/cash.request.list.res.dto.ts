import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CashLogStatus } from 'src/modules/client/types/cash-log.enum';

export class CashRequestListResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '캐시 로그 IDX' })
	public readonly cash_log_idx: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '광고주 IDX' })
	public readonly user_idx: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '광고주명' })
	public readonly company_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '입금자명' })
	public readonly depositor: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '충전액' })
	public readonly amount: number;

	@IsDate()
	@IsNotEmpty()
	@ApiProperty({ description: '충전 요청시점' })
	public readonly created_at: Date;

	@IsEnum(CashLogStatus)
	@IsNotEmpty()
	@ApiProperty({
		description: '승인 여부 (대기, 승인, 거절, 오류)',
		enum: CashLogStatus,
	})
	public readonly status: CashLogStatus;

	@IsDate()
	@IsNotEmpty()
	@ApiProperty({ description: '처리시점' })
	public readonly processed_at: Date;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '거절사유' })
	public readonly rejection_reason: string;

	constructor(cashLog: any) {
		this.cash_log_idx = cashLog.cash_log_idx;
		this.user_idx = cashLog.user_idx;
		this.company_name = cashLog.company_name;
		this.depositor = cashLog.depositor;
		this.amount = cashLog.amount;
		this.created_at = cashLog.created_at;
		this.status = cashLog.status;
		this.processed_at = cashLog.processed_at ?? null; // null 처리 추가
		this.rejection_reason = cashLog.rejection_reason ?? ''; // 기본값 빈 문자열
	}
}
