import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginReqDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 아이디' })
	public readonly user_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 비밀번호' })
	public readonly password: string;
}
