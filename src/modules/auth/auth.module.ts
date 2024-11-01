import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
	imports: [
		JwtModule.register({
			secret: process.env.JWT_ACCESS_SECRET, // 환경 변수에서 가져온 비밀 키
			signOptions: { expiresIn: '15m' },
		}),
	],
	providers: [AuthService, AuthGuard],
	exports: [AuthService], // AuthService를 export하여 다른 모듈에서 사용할 수 있게 함
})
export class AuthModule {}
