import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BoardFileResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '파일 저장된 URL', type: String })
	public readonly url: string;
}
