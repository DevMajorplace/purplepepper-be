import { ForbiddenException, Injectable, NotFoundException, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { paginate } from 'src/common/utils/pagination.util';
import { ERROR_MESSAGE_BOARD_NOT_FOUND, ERROR_MESSAGE_PERMISSION_DENIED } from '../../common/constants/error-messages';
import { Board } from '../../db/schema/board.schema';
import { Role } from '../auth/types/role.enum';
import { UploadService } from '../upload/upload.service';
import { BoardReqDto } from './dto/req/board.req.dto';
import { BoardDetailResDto } from './dto/res/board.detail.res.dto';
import { BoardItemDto } from './dto/res/board.item.dto';

@Injectable()
export class BoardService {
	constructor(
		@InjectModel(Board.name) private readonly boardModel: Model<Board>,
		private readonly uploadService: UploadService,
	) {}

	//전체 목록 조회
	async getAllBoards(
		page: number,
		pageSize: number = 15,
		category: string = '',
		title: string = '',
		@Req() req: any,
	): Promise<{
		data: BoardItemDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		const user = req.user;
		const query = this.buildQuery(user.role, category, title);
		const result = await paginate(this.boardModel, page, pageSize, query);

		const items = result.data.map(
			board =>
				new BoardItemDto({
					id: board.id,
					category: board.category,
					title: board.title,
					visible: board.visible,
					created_at: board.created_at,
				}),
		);

		return {
			data: items,
			totalItems: result.totalItems,
			totalPages: result.totalPages,
			currentPage: page,
			pageSize: pageSize,
		};
	}

	//게시글 조회
	async getBoardById(id: string, @Req() req: any): Promise<BoardDetailResDto> {
		const board = await this.boardModel.findById(id).exec();
		if (!board || board.deleted_at) {
			throw new NotFoundException(ERROR_MESSAGE_BOARD_NOT_FOUND);
		}

		const { role } = req.user;
		if (!board.visible.includes(role)) {
			throw new ForbiddenException(ERROR_MESSAGE_PERMISSION_DENIED);
		}

		// 유저쪽으로는 Presigned-Url을 만들어서 전달
		const file_urls = await this.uploadService.getPresignedURL(board.file_keys);

		return new BoardDetailResDto({
			id: board._id.toString(),
			category: board.category,
			title: board.title,
			content: board.content,
			visible: board.visible,
			file_urls: file_urls,
			created_at: board.created_at,
		});
	}

	//생성
	async createBoard(board: BoardReqDto): Promise<Board> {
		const visible = board.visible.includes(Role.Admin) ? board.visible : board.visible.concat(Role.Admin);
		// DB쪽에 데이터 저장할때도 key 기반으로 작업
		const newBoard = new this.boardModel({
			category: board.category,
			title: board.title,
			content: board.content,
			visible: visible,
			file_keys: board.file_keys,
		});
		return await newBoard.save();
	}

	//수정
	async updateBoard(id: string, boardReqDto: BoardReqDto): Promise<BoardDetailResDto> {
		const updatedBoard = await this.boardModel.findByIdAndUpdate(id, boardReqDto, { new: true }).exec();

		if (!updatedBoard) {
			throw new NotFoundException(ERROR_MESSAGE_BOARD_NOT_FOUND);
		}

		const file_urls = await this.uploadService.getPresignedURL(updatedBoard.file_keys);

		return new BoardDetailResDto({
			id: updatedBoard._id.toString(),
			category: updatedBoard.category,
			title: updatedBoard.title,
			content: updatedBoard.content,
			visible: updatedBoard.visible,
			file_urls: file_urls,
			created_at: updatedBoard.created_at,
		});
	}

	//삭제
	async deleteBoard(id: string): Promise<BoardDetailResDto> {
		const deletedBoard = await this.boardModel.findByIdAndUpdate(id, { deleted_at: new Date() }).exec();

		if (!deletedBoard) {
			throw new NotFoundException(ERROR_MESSAGE_BOARD_NOT_FOUND);
		}

		const file_urls = await this.uploadService.getPresignedURL(deletedBoard.file_keys);

		return new BoardDetailResDto({
			id: deletedBoard._id.toString(),
			category: deletedBoard.category,
			title: deletedBoard.title,
			content: deletedBoard.content,
			visible: deletedBoard.visible,
			file_urls: file_urls,
			created_at: deletedBoard.created_at,
		});
	}

	private buildQuery(role: any, category: string, title: string) {
		const query = {} as any;

		query.deleted_at = null;
		query.visible = { $in: role };
		// 아래엔 겹치는 공백을 제거하기 위한 코드인데.. 나중에 가능하면 깔끔하게 개선해야겠다.
		if (category !== '') {
			query.category = {
				$regex: category
					.split(' ')
					.filter(v => v !== '')
					.join(' '),
				$options: 'i',
			};
		}
		if (title !== '') {
			query.title = {
				$regex: title
					.split(' ')
					.filter(v => v !== '')
					.join(' '),
				$options: 'i',
			};
		}

		return query;
	}
}
