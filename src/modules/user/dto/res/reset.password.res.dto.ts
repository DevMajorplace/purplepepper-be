import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '아이디' })
	user_id: string;

	@IsBoolean()
	@IsNotEmpty()
	@ApiProperty({ description: '비밀번호 변경 결과' })
	status: boolean;

	constructor(result: any) {
		this.user_id = result.user_id;
		this.status = result.status;
	}
}
