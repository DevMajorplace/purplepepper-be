import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERROR_MESSAGE_BOARD_NOT_FOUND } from '../../common/constants/error-messages';
import { BoardItemDto } from './dto/board.item.dto';
import { BoardReqDto } from './dto/req/board.req.dto';
import { BoardDetailResDto } from './dto/res/board.detail.res.dto';
import { BoardListResDto } from './dto/res/board.list.res.dto';
import { Board } from './schemas/board.schema';

@Injectable()
export class BoardsService {
	constructor(@InjectModel(Board.name) private readonly boardModel: Model<Board>) {}

	//전체 목록 조회
	async getAllBoards(): Promise<BoardListResDto> {
		const boards = await this.boardModel.find().exec();
		const items = boards.map(
			board =>
				new BoardItemDto({
					id: board.id,
					category: board.category,
					title: board.title,
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
}
