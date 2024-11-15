import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NoticeResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '게시글 제목' })
	public readonly title: string;

	constructor(partial: Partial<NoticeResDto>) {
		Object.assign(this, partial);
	}
}
