import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Board, BoardSchema } from '../../db/schema/board.schema';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: Board.name, schema: BoardSchema }]), AuthModule, UserModule],
	providers: [DashboardService],
	controllers: [DashboardController],
})
export class DashboardModule {}
