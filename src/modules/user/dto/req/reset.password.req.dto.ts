import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordReqDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '변경할 비밀번호' })
	public readonly password: string;
}
