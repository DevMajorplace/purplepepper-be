import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class BoardItemDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '게시글 id' })
	public readonly id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '카테고리' })
	public readonly category: string;
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '제목' })
	public readonly title: string;

	@IsString()
	@ApiProperty({ description: '내용' })
	public readonly content: string;

	@IsString()
	@ApiProperty({ description: '첨부파일 url' })
	public readonly url: string;

	@IsDate()
	@Type(() => Date)
	@ApiProperty({ description: '게시글 등록일' })
	public readonly created_at: Date;

	constructor(partial: Partial<BoardItemDto>) {
		Object.assign(this, partial);
	}
}
