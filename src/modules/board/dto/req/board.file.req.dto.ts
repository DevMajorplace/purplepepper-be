import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class BoardFileReqDto {
	@IsArray()
	@IsNotEmpty()
	@ApiProperty({ description: '첨부파일', type: 'string', format: 'file' })
	files: any[];
}
