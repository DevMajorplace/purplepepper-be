import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BoardItemDto } from './dto/board.item.dto';
import { CreateBoardReqDto } from './dto/req/create.board.req.dto';
import { BoardListResDto } from './dto/res/board.list.res.dto';
import { Board } from './schemas/board.schema';

@Injectable()
export class BoardsService {
	constructor(@InjectModel(Board.name) private readonly boardModel: Model<Board>) {}

	//조회
	async getAllBoards(): Promise<BoardListResDto> {
		const boards = await this.boardModel.find().exec();
		const items = boards.map(
			board =>
				new BoardItemDto({
					category: board.category,
					title: board.title,
					created_at: board.created_at
				})
		);

		const boardList = new BoardListResDto(items);
		return boardList;
	}

	//생성
	async createBoard(board: CreateBoardReqDto): Promise<Board> {
		const newBoard = new this.boardModel(board);
		return await newBoard.save();
	}
}
