import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BoardListReqDto {
	@IsString()
	@IsOptional()
	@ApiProperty({ description: '공지사항 카테고리 별 검색 단어', required: false })
	public readonly category: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '공지사항 제목 별 검색 단어', required: false })
	public readonly title: string;
}
