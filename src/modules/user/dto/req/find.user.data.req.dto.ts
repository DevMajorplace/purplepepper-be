import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindUserDataReqDto {
	@IsString()
	@ApiProperty({ description: '유저 아이디', required: false })
	public readonly user_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 이름', required: true })
	public readonly manager_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 연락처', required: true })
	public readonly manager_contact: string;
}
