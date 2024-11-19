import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseDatabaseModule } from './db/mongoose.module';
import { AdminModule } from './modules/admin/admin.module';
import { AgencyModule } from './modules/agency/agency.module';
import { BoardModule } from './modules/board/board.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UserModule } from './modules/user/user.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		MongooseDatabaseModule,
		UserModule,
		BoardModule,
		AdminModule,
		DashboardModule,
		AgencyModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
