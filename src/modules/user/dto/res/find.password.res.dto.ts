import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindPasswordResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '아이디' })
	user_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '데이터 접근을 위한 일회용 토큰' })
	reset_token: string;

	constructor(data: any) {
		this.user_id = data.user_id;
		this.reset_token = data.reset_token;
	}
}
