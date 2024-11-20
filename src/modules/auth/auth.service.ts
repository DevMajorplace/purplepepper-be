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

	createToken(payload: any, type: 'access' | 'refresh' | 'reset'): string {
		const jwtOptions = this.setSignJwtOptions(type);
		return this.jwtService.sign(payload, jwtOptions);
	}

	verifyToken(token: string, type: 'access' | 'refresh' | 'reset'): any {
		const jwtOptions = this.setVerifyJwtOptions(type);
		try {
			const verify = this.jwtService.verify(token, jwtOptions);
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

	private setSignJwtOptions(type: 'access' | 'refresh' | 'reset'): { secret: string; expiresIn: string } {
		const jwtOptions = { secret: '', expiresIn: '' };
		switch (type) {
			case 'access':
				jwtOptions.secret = this.configService.get<string>('JWT_ACCESS_TOKEN');
				jwtOptions.expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRED_TIME');
				break;
			case 'refresh':
				jwtOptions.secret = this.configService.get<string>('JWT_REFRESH_TOKEN');
				jwtOptions.expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRED_TIME');
				break;
			case 'reset':
				jwtOptions.secret = this.configService.get<string>('JWT_RESET_TOKEN');
				jwtOptions.expiresIn = this.configService.get<string>('JWT_RESET_EXPIRED_TIME');
				break;
		}
		return jwtOptions;
	}

	private setVerifyJwtOptions(type: 'access' | 'refresh' | 'reset'): { secret: string } {
		const jwtOptions = { secret: '' };
		switch (type) {
			case 'access':
				jwtOptions.secret = this.configService.get<string>('JWT_ACCESS_TOKEN');
				break;
			case 'refresh':
				jwtOptions.secret = this.configService.get<string>('JWT_REFRESH_TOKEN');
				break;
			case 'reset':
				jwtOptions.secret = this.configService.get<string>('JWT_RESET_TOKEN');
				break;
		}
		return jwtOptions;
	}
}
