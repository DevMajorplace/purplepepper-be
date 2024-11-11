import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseService } from './mongoose.service';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get<string>('MONGO_URI'),
			}),
		}),
	],
	providers: [MongooseService],
	exports: [MongooseService],
})
export class MongooseDatabaseModule {}
