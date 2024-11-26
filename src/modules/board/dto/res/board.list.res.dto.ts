import { ApiProperty } from '@nestjs/swagger';
import { BoardItemDto } from './board.item.dto';

export class BoardListResDto {
	@ApiProperty({ type: [BoardItemDto], description: '게시글 목록' })
	public readonly items: BoardItemDto[];

	constructor(items: BoardItemDto[]) {
		this.items = items;
	}
}
