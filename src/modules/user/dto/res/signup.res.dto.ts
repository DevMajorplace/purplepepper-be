import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignUpResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '가입 승인 상태: approved, pending, declined' })
	public readonly status: 'approved' | 'pending' | 'declined';

	constructor(partial: Partial<SignUpResDto>) {
		Object.assign(this, partial);
	}
}
