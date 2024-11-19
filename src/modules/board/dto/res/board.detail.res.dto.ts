import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Role } from 'src/modules/auth/types/role.enum';

export class BoardDetailResDto {
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
	@IsNotEmpty()
	@ApiProperty({ description: '내용' })
	public readonly content: string;

	@IsArray()
	@IsNotEmpty()
	@ApiProperty({ description: '공개 범위 - admin, agency, client' })
	public readonly visible: Role[];

	@IsString()
	@ApiProperty({ description: '첨부파일 url' })
	public readonly file_urls?: string[];

	@IsDate()
	@ApiProperty({ description: '게시글 등록일' })
	public readonly created_at: Date;

	constructor(partial: Partial<BoardDetailResDto>) {
		Object.assign(this, partial);
	}
}
