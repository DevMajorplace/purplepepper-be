import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
					created_at: board.created_at
				})
		);

		const boardList = new BoardListResDto(items);
		return boardList;
	}

	//게시글 조회
	async getBoardById(id: string): Promise<BoardDetailResDto> {
		const board = await this.boardModel.findById(id).exec();
		if (!board) {
			throw new NotFoundException('해당 게시글을 찾을 수 없습니다.');
		}

		return new BoardDetailResDto({
			id: board._id.toString(),
			category: board.category,
			title: board.title,
			content: board.content,
			visible: board.visible,
			file_urls: board.file_urls,
			created_at: board.created_at
		});
	}

	//생성
	async createBoard(board: BoardReqDto): Promise<Board> {
		const newBoard = new this.boardModel(board);
		return await newBoard.save();
	}

	//수정
	async updateBoard(id: string, board: BoardReqDto): Promise<Board> {
		return await this.boardModel.findByIdAndUpdate(id, board, { new: true }).exec();
	}

	//삭제
	async deleteBoard(id: string): Promise<Board> {
		return await this.boardModel.findByIdAndDelete(id).exec();
	}
}
