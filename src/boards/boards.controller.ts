import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardReqDto } from './dto/req/create.board.req.dto';
import { BoardListResDto } from './dto/res/board.list.res.dto';
import { Board } from './schemas/board.schema';

@ApiTags('boards')
@Controller('boards')
export class BoardsController {
	constructor(private readonly boardService: BoardsService) {}

	@Get()
	@ApiResponse({ type: BoardListResDto })
	async getBoardsList(): Promise<BoardListResDto> {
		return this.boardService.getAllBoards();
	}

	@Post()
	@ApiResponse({ type: Board })
	async createBoard(@Body() board: CreateBoardReqDto): Promise<Board> {
		return this.boardService.createBoard(board);
	}
}
