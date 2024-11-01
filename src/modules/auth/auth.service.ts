import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
	constructor(private readonly jwtService: JwtService) {}

	createToken(payload: any): string {
		return this.jwtService.sign(payload, {
			secret: process.env.JWT_ACCESS_SECRET,
			expiresIn: '15m',
		});
	}

	verifyToken(token: string): any {
		return this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
	}
}
