import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TargetSalesResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 아이디', required: true })
	public readonly user_id: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '목표 매출', required: true })
	public readonly target_sales: number;

	constructor(partial: Partial<TargetSalesResDto>) {
		Object.assign(this, partial);
	}
}
