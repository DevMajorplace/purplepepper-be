import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoginLog, LoginLogSchema } from '../../db/schema/login-log.schema';
import { User, UserSchema } from '../../db/schema/user.schema';
import { AuthModule } from '../auth/auth.module';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: LoginLog.name, schema: LoginLogSchema },
		]),
		AuthModule,
	],
	providers: [AgencyService],
	controllers: [AgencyController],
	exports: [AgencyService],
})
export class AgencyModule {}
