import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
	imports: [
		ConfigModule, // ConfigModule 추가
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_ACCESS_SECRET'),
				signOptions: { expiresIn: '15m' },
			}),
		}),
	],
	providers: [AuthService, AuthGuard],
	exports: [AuthService],
})
export class AuthModule {}
