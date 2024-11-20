import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChargeCashResDto {
	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '충전 비용' })
	public readonly amount: number;

	constructor(partial: Partial<ChargeCashResDto>) {
		Object.assign(this, partial);
	}
}
