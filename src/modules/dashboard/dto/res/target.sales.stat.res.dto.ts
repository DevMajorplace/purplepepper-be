import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TargetSalesStatResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '이번 달' })
	public readonly current_month: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '이번 달 목표 매출' })
	public readonly target_sales: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '달성율' })
	public readonly achievement_rate: number;

	constructor(partial: Partial<TargetSalesStatResDto>) {
		Object.assign(this, partial);
	}
}
