import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '가입 승인 상태: approved, pending, rejected' })
	public readonly status: 'approved' | 'pending' | 'rejected';

	constructor(partial: Partial<UserResDto>) {
		Object.assign(this, partial);
	}
}
