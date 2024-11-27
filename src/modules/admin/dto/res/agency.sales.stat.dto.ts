import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AgencySalesStatResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체명' })
	public readonly company_name: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '현재 매출' })
	public readonly current_sales: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '목표 매출' })
	public readonly target_sales: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '달성율' })
	public readonly achievement_rate: number;

	constructor(partial: Partial<AgencySalesStatResDto>) {
		Object.assign(this, partial);
	}
}
