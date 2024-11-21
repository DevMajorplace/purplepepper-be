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
		const jwtOptions = this.setJwtOptions(type, 'sign');
		return this.jwtService.sign(payload, jwtOptions);
	}

	verifyToken(token: string, type: 'access' | 'refresh' | 'reset'): any {
		const jwtOptions = this.setJwtOptions(type, 'verify');
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

	private setJwtOptions(
		type: 'access' | 'refresh' | 'reset',
		options: 'sign' | 'verify',
	): { secret: string; expiresIn?: string } {
		const jwtOptions = this.initJwtOptionType(options);
		switch (type) {
			case 'access':
				jwtOptions.secret = this.configService.get<string>('JWT_ACCESS_TOKEN');
				if (options === 'sign') jwtOptions.expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRED_TIME');
				break;
			case 'refresh':
				jwtOptions.secret = this.configService.get<string>('JWT_REFRESH_TOKEN');
				if (options === 'sign') jwtOptions.expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRED_TIME');
				break;
			case 'reset':
				jwtOptions.secret = this.configService.get<string>('JWT_RESET_TOKEN');
				if (options === 'sign') jwtOptions.expiresIn = this.configService.get<string>('JWT_RESET_EXPIRED_TIME');
				break;
		}
		return jwtOptions;
	}

	private initJwtOptionType(options: 'sign' | 'verify'): { secret: string; expiresIn?: string } {
		return options === 'sign' ? { secret: '', expiresIn: '' } : { secret: '' };
	}
}
