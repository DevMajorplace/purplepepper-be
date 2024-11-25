import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CashLog, CashLogSchema } from '../../db/schema/cash-log.schema';
import { LoginLog, LoginLogSchema } from '../../db/schema/login-log.schema';
import { User, UserSchema } from '../../db/schema/user.schema';
import { AuthModule } from '../auth/auth.module';
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
