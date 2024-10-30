import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateBoardReqDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '카테고리' })
	category: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '제목' })
	title: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '내용' })
	content: string;

	@IsArray()
	@IsNotEmpty()
	@ApiProperty({ description: '공개 범위 - admin, agency, client' })
	visible: string[];

	@IsString()
	@ApiProperty({ description: '파일 url' })
	file_urls?: string[];
}
