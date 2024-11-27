import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class UserStatusQueryDto {
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

	@ApiProperty({ description: '사용자 상태', enum: ['pending', 'declined'] })
	@IsIn(['pending', 'declined'], {
		message: 'status 값은 pending 또는 declined 중 하나여야 합니다.',
	})
	status: 'pending' | 'declined';
}
