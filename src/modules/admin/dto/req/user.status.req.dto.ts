import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/page-query.dto';

export class UserStatusQueryDto extends PaginationQueryDto {
	@ApiProperty({ description: '사용자 상태', enum: ['pending', 'declined'] })
	@IsIn(['pending', 'declined'], {
		message: 'status 값은 pending 또는 declined 중 하나여야 합니다.',
	})
	status: 'pending' | 'declined';
}
