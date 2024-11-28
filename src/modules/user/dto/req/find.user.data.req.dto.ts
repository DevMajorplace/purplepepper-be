import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindUserDataReqDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자 이름', required: true })
	public readonly manager_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자 연락처', required: true })
	public readonly manager_contact: string;
}
