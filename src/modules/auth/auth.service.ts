import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	createToken(payload: any): string {
		return this.jwtService.sign(payload, {
			secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
			expiresIn: '15m',
		});
	}

	verifyToken(token: string): any {
		return this.jwtService.verify(token, {
			secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
		});
	}
}
