import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/modules/auth/types/role.enum';

export class BoardReqDto {
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
	@IsEnum(Role, { each: true })
	@IsNotEmpty()
	@ApiProperty({ description: '공개 범위 - admin, agency, client' })
	public readonly visible: Role[];

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	@ApiProperty({ description: '파일 url', required: false })
	public readonly file_urls?: string[];
}
