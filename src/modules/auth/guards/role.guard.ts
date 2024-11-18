import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_MESSAGE_INVALID_TOKEN, ERROR_MESSAGE_PERMISSION_DENIED } from 'src/common/constants/error-messages';
import { Role } from '../types/role.enum';

@Injectable()
export class RoleGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const roles: Role[] = this.reflector.getAllAndOverride<Role[]>('userRoles', [
			context.getHandler(),
			context.getClass(),
		]);
		if (!roles) return true;

		const request = context.switchToHttp().getRequest();
		if (!request.user) {
			throw new UnauthorizedException(ERROR_MESSAGE_INVALID_TOKEN);
		}

		const { role } = request.user;
		if (!role || !roles.includes(role)) {
			throw new UnauthorizedException(ERROR_MESSAGE_PERMISSION_DENIED);
		}

		return true;
	}
}
