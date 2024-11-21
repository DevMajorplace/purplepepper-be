import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { Advertisement, AdvertisementSchema } from './schemas/advertisement.schema';
import { CashLog, CashLogSchema } from './schemas/cash-log.schema';

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
