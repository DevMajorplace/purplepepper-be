import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseDatabaseModule } from './db/mongoose.module';
import { BoardsModule } from './modules/boards/boards.module';
import { UsersModule } from './modules/users/users.module';

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true }), MongooseDatabaseModule, UsersModule, BoardsModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
