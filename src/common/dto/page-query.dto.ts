import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationQueryDto {
	@ApiProperty({ description: '페이지 넘버' })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1, { message: 'page 값은 1 이상이어야 합니다.' })
	page?: number;

	@ApiProperty({ description: '페이지 당 표시개수' })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	pageSize?: number;
}
