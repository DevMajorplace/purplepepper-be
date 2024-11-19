import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ERROR_MESSAGE_NO_TOKEN } from '../../../common/constants/error-messages';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const token = request.cookies?.access_token;

		if (!token) {
			throw new UnauthorizedException(ERROR_MESSAGE_NO_TOKEN);
		}

		// 요청 객체에 사용자 정보를 추가하여 이후 로직에서 사용 가능
		const payload = this.authService.verifyAccessToken(token);
		request.user = payload;

		return true;
	}
}
