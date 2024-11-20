import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CashLog, CashLogSchema } from '../client/schemas/cash-log.schema';
import { LoginLog, LoginLogSchema } from '../user/schemas/login-log.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: LoginLog.name, schema: LoginLogSchema },
			{ name: CashLog.name, schema: CashLogSchema },
		]),
		AuthModule,
	],
	controllers: [AdminController],
	providers: [AdminService],
	exports: [AdminService],
})
export class AdminModule {}
