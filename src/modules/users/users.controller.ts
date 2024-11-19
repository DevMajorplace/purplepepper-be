import { Body, Controller, Get, Post, Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { extractTokenFromHeader } from '../auth/utils/auth.util';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	// 회원가입
	@Post('signup')
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@ApiResponse({ type: SignUpResDto })
	async signUp(@Body() user: SignUpReqDto): Promise<SignUpResDto> {
		return this.usersService.signUp(user);
	}

	// 로그인
	@Post('login')
	async login(@Body() user: LoginReqDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
		const { accessToken, refreshToken } = await this.usersService.login(user, req);
		res.setHeader('Authorization', 'Bearer ' + [accessToken, refreshToken]);
		res.cookie('access_token', accessToken, { httpOnly: true });
		res.cookie('refresh_token', refreshToken, { httpOnly: true });
		return { accessToken, refreshToken };
	}

	@Post('logout')
	async logout(@Req() req: Request, @Res() res: Response) {
		const token = extractTokenFromHeader(req);
		await this.usersService.logout(token);
		res.clearCookie('access_token');
		res.clearCookie('refresh_token');
		return res.status(200).send();
	}

	// User Token Refresh
	@Get('refresh')
	async tokenRefresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ accessToken: string }> {
		const token = extractTokenFromHeader(req);
		const { accessToken } = await this.usersService.tokenRefresh(token);
		res.setHeader('Authorization', 'Bearer ' + accessToken);
		res.cookie('access_token', accessToken, { httpOnly: true });
		return { accessToken: accessToken };
	}
}
