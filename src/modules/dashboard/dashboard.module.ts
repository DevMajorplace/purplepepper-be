import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Board, BoardSchema } from '../boards/schemas/board.schema';
import { UsersModule } from '../users/users.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: Board.name, schema: BoardSchema }]), AuthModule, UsersModule],
	providers: [DashboardService],
	controllers: [DashboardController],
})
export class DashboardModule {}
