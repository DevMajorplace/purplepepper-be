import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ERROR_MESSAGE_EXPIRED_TOKEN, ERROR_MESSAGE_INVALID_TOKEN } from 'src/common/constants/error-messages';

@Injectable()
export class AuthService {
	constructor(private readonly jwtService: JwtService) {}

	createToken(payload: any): string {
		return this.jwtService.sign(payload);
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
