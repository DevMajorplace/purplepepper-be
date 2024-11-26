import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class SingleTargetSalesReqDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 아이디', required: true })
	public readonly user_id: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '목표 매출', required: true })
	public readonly target_sales: number;
}

export class TargetSalesReqDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SingleTargetSalesReqDto)
	@ApiProperty({
		description: '목표 매출 설정 데이터 배열',
		isArray: true,
		required: true,
		type: SingleTargetSalesReqDto,
	})
	public readonly targets: SingleTargetSalesReqDto[];
}
