import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserRoles } from '../auth/types/role.decorator';
import { Role } from '../auth/types/role.enum';
import { BoardsService } from './boards.service';
import { BoardReqDto } from './dto/req/board.req.dto';
import { BoardDetailResDto } from './dto/res/board.detail.res.dto';
import { BoardListResDto } from './dto/res/board.list.res.dto';
import { Board } from './schemas/board.schema';

@ApiTags('Boards')
@UseGuards(AuthGuard)
@Controller('boards')
export class BoardsController {
	constructor(private readonly boardService: BoardsService) {}

	@Get()
	@ApiResponse({ type: BoardListResDto })
	async getBoardsList(): Promise<BoardListResDto> {
		return this.boardService.getAllBoards();
	}

	@Get(':id')
	@ApiResponse({ type: Board })
	async getBoard(@Param('id') id: string): Promise<BoardDetailResDto> {
		return this.boardService.getBoardById(id);
	}

	@Post()
	@UserRoles([Role.Admin])
	@ApiResponse({ type: Board })
	async createBoard(@Body() board: BoardReqDto): Promise<Board> {
		return this.boardService.createBoard(board);
	}

	@Put(':id')
	@UserRoles([Role.Admin])
	@ApiResponse({ type: BoardDetailResDto })
	async updateBoard(@Param('id') id: string, @Body() board: BoardReqDto): Promise<BoardDetailResDto> {
		return this.boardService.updateBoard(id, board);
	}

	@Delete(':id')
	@UserRoles([Role.Admin])
	@ApiResponse({ type: BoardDetailResDto })
	async deleteBoard(@Param('id') id: string): Promise<BoardDetailResDto> {
		return this.boardService.deleteBoard(id);
	}
}
