import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseDatabaseModule } from './db/mongoose.module';

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true }), MongooseDatabaseModule],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
