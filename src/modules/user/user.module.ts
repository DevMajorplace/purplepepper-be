import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoginLog, LoginLogSchema } from '../../db/schema/login-log.schema';
import { User, UserSchema } from '../../db/schema/user.schema';
import { AuthModule } from '../auth/auth.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: LoginLog.name, schema: LoginLogSchema },
		]),
		AuthModule,
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService, MongooseModule],
})
export class UserModule {}
