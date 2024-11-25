import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Board, BoardSchema } from '../../db/schema/board.schema';
import { AuthModule } from '../auth/auth.module';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: Board.name, schema: BoardSchema }]), AuthModule],
	providers: [BoardService],
	controllers: [BoardController],
})
export class BoardModule {}
