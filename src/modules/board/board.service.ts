import { Injectable, NotFoundException, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { paginate } from 'src/common/utils/pagination.util';
import { ERROR_MESSAGE_BOARD_NOT_FOUND } from '../../common/constants/error-messages';
import { Board } from '../../db/schema/board.schema';
import { BoardItemDto } from './dto/board.item.dto';
import { BoardReqDto } from './dto/req/board.req.dto';
import { BoardDetailResDto } from './dto/res/board.detail.res.dto';
import { BoardListResDto } from './dto/res/board.list.res.dto';

@Injectable()
export class BoardService {
	constructor(@InjectModel(Board.name) private readonly boardModel: Model<Board>) {}

	//전체 목록 조회
	async getAllBoards(
		page: number,
		pageSize: number = 15,
		category: string = '',
		title: string = '',
		@Req() req: any,
	): Promise<BoardListResDto> {
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

		const boardList = new BoardListResDto(items);
		return boardList;
	}

	//게시글 조회
	async getBoardById(id: string): Promise<BoardDetailResDto> {
		const board = await this.boardModel.findById(id).exec();
		if (!board) {
			throw new NotFoundException(ERROR_MESSAGE_BOARD_NOT_FOUND);
		}

		return new BoardDetailResDto({
			id: board._id.toString(),
			category: board.category,
			title: board.title,
			content: board.content,
			visible: board.visible,
			file_urls: board.file_urls,
			created_at: board.created_at,
		});
	}

	//생성
	async createBoard(board: BoardReqDto): Promise<Board> {
		const newBoard = new this.boardModel(board);
		return await newBoard.save();
	}

	//수정
	async updateBoard(id: string, boardReqDto: BoardReqDto): Promise<BoardDetailResDto> {
		const updatedBoard = await this.boardModel.findByIdAndUpdate(id, boardReqDto, { new: true }).exec();

		if (!updatedBoard) {
			throw new NotFoundException(ERROR_MESSAGE_BOARD_NOT_FOUND);
		}

		return new BoardDetailResDto({
			id: updatedBoard._id.toString(),
			category: updatedBoard.category,
			title: updatedBoard.title,
			content: updatedBoard.content,
			visible: updatedBoard.visible,
			file_urls: updatedBoard.file_urls,
			created_at: updatedBoard.created_at,
		});
	}

	//삭제
	async deleteBoard(id: string): Promise<BoardDetailResDto> {
		const deletedBoard = await this.boardModel.findByIdAndDelete(id).exec();

		if (!deletedBoard) {
			throw new NotFoundException(ERROR_MESSAGE_BOARD_NOT_FOUND);
		}

		return new BoardDetailResDto({
			id: deletedBoard._id.toString(),
			category: deletedBoard.category,
			title: deletedBoard.title,
			content: deletedBoard.content,
			visible: deletedBoard.visible,
			file_urls: deletedBoard.file_urls,
			created_at: deletedBoard.created_at,
		});
	}

	private buildQuery(role: any, category: string, title: string) {
		const query = {} as any;

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
