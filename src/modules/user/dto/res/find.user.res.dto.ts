import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindUserResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '아이디' })
	user_id: string;

	constructor(user: any) {
		this.user_id = user.user_id;
	}
}
