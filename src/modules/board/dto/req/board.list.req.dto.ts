import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/page-query.dto';

export class BoardListReqDto extends PaginationQueryDto {
	@IsString()
	@IsOptional()
	@ApiProperty({ description: '공지사항 카테고리 별 검색 단어', required: false })
	public readonly category?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '공지사항 제목 별 검색 단어', required: false })
	public readonly title?: string;
}
