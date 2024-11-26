import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Role } from 'src/modules/auth/types/role.enum';

export class BoardItemDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '게시글 id', type: String })
	public readonly id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '카테고리', type: String })
	public readonly category: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '제목', type: String })
	public readonly title: string;

	@IsArray()
	@IsNotEmpty()
	@ApiProperty({ description: '공개 범위 - admin, agency, client', enum: Role, isArray: true })
	public readonly visible: Role[];

	@IsDate()
	@Type(() => Date)
	@ApiProperty({ description: '게시글 등록일', type: Date })
	public readonly created_at: Date;

	constructor(partial: Partial<BoardItemDto>) {
		Object.assign(this, partial);
	}
}
