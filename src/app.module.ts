import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseDatabaseModule } from './db/mongoose.module';
import { AdminModule } from './modules/admin/admin.module';
import { BoardsModule } from './modules/boards/boards.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		MongooseDatabaseModule,
		UsersModule,
		BoardsModule,
		AdminModule,
		DashboardModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
