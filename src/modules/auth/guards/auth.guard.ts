import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ERROR_MESSAGE_NO_TOKEN, ERROR_MESSAGE_PERMISSION_DENIED } from '../../../common/constants/error-messages';
import { AuthService } from '../auth.service';
import { Role } from '../types/role.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private authService: AuthService,
		private reflector: Reflector,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);
		const roles: Role[] = this.reflector.get<Role[]>('userRoles', context.getHandler());

		if (!token) {
			throw new UnauthorizedException(ERROR_MESSAGE_NO_TOKEN);
		}

		// 요청 객체에 사용자 정보를 추가하여 이후 로직에서 사용 가능
		const payload = this.authService.verifyToken(token);
		request.user = payload;

		// 사용자 권한을 보고 이후 작업 진행 여부 판단
		if (roles && !roles.includes(payload.role)) {
			throw new UnauthorizedException(ERROR_MESSAGE_PERMISSION_DENIED);
		}

		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined; // JWT 구분
	}
}
