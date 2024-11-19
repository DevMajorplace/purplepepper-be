import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ERROR_MESSAGE_EXPIRED_TOKEN, ERROR_MESSAGE_INVALID_TOKEN } from 'src/common/constants/error-messages';

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	// Create Token -> Save Refresh Token in Database -> Sending Tokens
	createAccessToken(payload: any): string {
		// payload: { userId, role }
		return this.jwtService.sign(payload, {
			secret: this.configService.get<string>('JWT_ACCESS_TOKEN'),
			expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRED_TIME'),
		});
	}

	createRefreshToken(payload: any): { refreshToken: string; expiredTimestamp: number } {
		// payload: { userId }
		const token = this.jwtService.sign(payload, {
			secret: this.configService.get<string>('JWT_REFRESH_TOKEN'),
			expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRED_TIME'),
		});
		const { exp } = this.jwtService.verify(token);
		return { refreshToken: token, expiredTimestamp: exp };
	}

	verifyToken(token: string): any {
		// token 검증하면서 발생하는 에러를 이 함수에서 처리하는걸로 변경
		try {
			const verify = this.jwtService.verify(token);
			return verify;
		} catch (error) {
			switch (error.message) {
				case 'INVALID_TOKEN':
				case 'TOKEN_IS_ARRAY':
				case 'NO_USER':
					throw new UnauthorizedException(ERROR_MESSAGE_INVALID_TOKEN);
				case 'EXPIRED_TOKEN':
					throw new UnauthorizedException(ERROR_MESSAGE_EXPIRED_TOKEN);
			}
		}
	}
}
