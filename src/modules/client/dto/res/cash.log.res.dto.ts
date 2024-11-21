import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CashLogStatus, CashLogType } from 'src/modules/client/types/cash-log.enum';

export class CashLogResDto {
	@IsDate()
	@IsNotEmpty()
	@ApiProperty({ description: '요청 시간' })
	public readonly created_at: Date;

	@IsEnum(CashLogStatus)
	@IsNotEmpty()
	@ApiProperty({
		description: '상태 (대기, 승인, 거절, 오류, 사용, 환급)',
		enum: CashLogStatus,
	})
	public readonly status: CashLogStatus;

	@IsEnum(CashLogType)
	@IsNotEmpty()
	@ApiProperty({
		description: '카테고리 (환급, 미션 등록, 입금 대기, 입금 확인, 입금 기한 초과, 취소)',
		enum: CashLogType,
	})
	public readonly type: CashLogType;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '미션명', required: false })
	public readonly advertisement_title?: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '증가/차감 캐시 금액' })
	public readonly amount: number;

	constructor(log: any, includeTitle: boolean = false) {
		this.created_at = log.created_at;
		this.status = log.status;
		this.type = log.type;
		this.advertisement_title = includeTitle ? (log.advertisement_title ?? null) : undefined;
		this.amount = log.amount;
	}
}
