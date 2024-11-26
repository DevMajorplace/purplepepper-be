import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Advertisement, AdvertisementSchema } from '../../db/schema/advertisement.schema';
import { CashLog, CashLogSchema } from '../../db/schema/cash-log.schema';
import { User, UserSchema } from '../../db/schema/user.schema';
import { AuthModule } from '../auth/auth.module';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: CashLog.name, schema: CashLogSchema },
			{ name: Advertisement.name, schema: AdvertisementSchema },
		]),
		AuthModule,
	],
	controllers: [ClientController],
	providers: [ClientService],
	exports: [ClientService, MongooseModule],
})
export class ClientModule {}
