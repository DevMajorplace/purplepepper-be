import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BusinessRegistrationReqDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 아이디' })
	public readonly user_id: string;
}
