import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonthlySales, MonthlySalesSchema } from 'src/db/schema/monthly-sales.schema';
import { Board, BoardSchema } from '../../db/schema/board.schema';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Board.name, schema: BoardSchema },
			{ name: MonthlySales.name, schema: MonthlySalesSchema },
		]),
		AuthModule,
		UserModule,
	],
	providers: [DashboardService],
	controllers: [DashboardController],
})
export class DashboardModule {}
