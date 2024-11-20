import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChargeCashReqDto {
	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '충전 금액' })
	public readonly amount: number;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '입금자 명' })
	public readonly depositor: string;
}
