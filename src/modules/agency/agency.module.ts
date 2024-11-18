import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { LoginLog, LoginLogSchema } from '../users/schemas/login-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
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
