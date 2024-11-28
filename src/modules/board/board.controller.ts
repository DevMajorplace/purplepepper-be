import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	Req,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Board } from '../../db/schema/board.schema';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRoles } from '../auth/types/role.decorator';
import { Role } from '../auth/types/role.enum';
import { UploadService } from '../upload/upload.service';
import { BoardService } from './board.service';
import { BoardFileReqDto } from './dto/req/board.file.req.dto';
import { BoardListReqDto } from './dto/req/board.list.req.dto';
import { BoardReqDto } from './dto/req/board.req.dto';
import { BoardDetailResDto } from './dto/res/board.detail.res.dto';
import { BoardFileResDto } from './dto/res/board.file.res.dto';
import { BoardItemDto } from './dto/res/board.item.dto';

@Controller('boards')
@ApiTags('Boards')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
export class BoardController {
	constructor(
		private readonly boardService: BoardService,
		private readonly uploadService: UploadService,
	) {}

	@Get()
	@ApiExtraModels(BoardItemDto)
	@UserRoles(Role.Admin, Role.Agency, Role.Client)
	@ApiResponse({
		schema: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: { $ref: getSchemaPath(BoardItemDto) },
				},
				totalItems: { type: 'number' },
				totalPages: { type: 'number' },
				currentPage: { type: 'number' },
				pageSize: { type: 'number' },
			},
		},
	})
	async getBoardsList(
		@Query('page') page: number,
		@Query('pageSize') pageSize: number,
		@Query() boardsListReqDto: BoardListReqDto,
		@Req() req: Request,
	): Promise<{
		data: BoardItemDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		const { category, title } = boardsListReqDto;
		return this.boardService.getAllBoards(page, pageSize, category, title, req);
	}

	@Get(':id')
	@UserRoles(Role.Admin, Role.Agency, Role.Client)
	@ApiResponse({ type: Board })
	async getBoard(@Param('id') id: string, @Req() req: Request): Promise<BoardDetailResDto> {
		return this.boardService.getBoardById(id, req);
	}

	@Post()
	@UserRoles(Role.Admin)
	@ApiResponse({ type: Board })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
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

	@Post('file')
	@UserRoles(Role.Admin)
	@ApiBody({ type: BoardFileReqDto, required: true })
	@ApiResponse({ type: BoardFileResDto, isArray: true })
	@UseInterceptors(FilesInterceptor('files'))
	async uploadFile(@UploadedFiles() files: Express.Multer.File[]): Promise<BoardFileResDto[]> {
		return this.uploadService.uploadToS3(files);
	}
}
