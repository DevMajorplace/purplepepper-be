import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { Board, BoardSchema } from './schemas/board.schema';

@Module({
	imports: [MongooseModule.forFeature([{ name: Board.name, schema: BoardSchema }]), AuthModule],
	providers: [BoardService],
	controllers: [BoardController],
})
export class BoardModule {}
