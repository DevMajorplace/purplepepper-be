import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Board } from '../../db/schema/board.schema';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRoles } from '../auth/types/role.decorator';
import { Role } from '../auth/types/role.enum';
import { BoardService } from './board.service';
import { BoardListReqDto } from './dto/req/board.list.req.dto';
import { BoardReqDto } from './dto/req/board.req.dto';
import { BoardDetailResDto } from './dto/res/board.detail.res.dto';
import { BoardListResDto } from './dto/res/board.list.res.dto';

@Controller('boards')
@ApiTags('Boards')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
export class BoardController {
	constructor(private readonly boardService: BoardService) {}

	@Get()
	@UserRoles(Role.Admin, Role.Agency, Role.Client)
	@ApiResponse({ type: BoardListResDto })
	async getBoardsList(
		@Query('page') page: number,
		@Query('pageSize') pageSize: number,
		@Query() boardsListReqDto: BoardListReqDto,
		@Req() req: Request,
	): Promise<BoardListResDto> {
		const { category, title } = boardsListReqDto;
		return this.boardService.getAllBoards(page, pageSize, category, title, req);
	}

	@Get(':id')
	@UserRoles(Role.Admin, Role.Agency, Role.Client)
	@ApiResponse({ type: Board })
	async getBoard(@Param('id') id: string): Promise<BoardDetailResDto> {
		return this.boardService.getBoardById(id);
	}

	@Post()
	@UserRoles(Role.Admin)
	@ApiResponse({ type: Board })
	async createBoard(@Body() board: BoardReqDto): Promise<Board> {
		return this.boardService.createBoard(board);
	}

	@Put(':id')
	@UserRoles(Role.Admin)
	@ApiResponse({ type: BoardDetailResDto })
	async updateBoard(@Param('id') id: string, @Body() board: BoardReqDto): Promise<BoardDetailResDto> {
		return this.boardService.updateBoard(id, board);
	}

	@Delete(':id')
	@UserRoles(Role.Admin)
	@ApiResponse({ type: BoardDetailResDto })
	async deleteBoard(@Param('id') id: string): Promise<BoardDetailResDto> {
		return this.boardService.deleteBoard(id);
	}
}
