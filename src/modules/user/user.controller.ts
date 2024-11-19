import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { UserDetailReqDto } from './dto/req/user.detail.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { UserDetailResDto } from './dto/res/user.detail.res.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	// 회원가입
	@Post('signup')
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	@ApiResponse({ type: SignUpResDto })
	async signUp(@Body() user: SignUpReqDto): Promise<SignUpResDto> {
		return this.userService.signUp(user);
	}

	// 로그인
	@Post('login')
	async login(@Body() user: LoginReqDto, @Req() req: any, @Res() res: Response) {
		const { accessToken, refreshToken } = await this.userService.login(user, req);
		res.cookie('access_token', accessToken, { httpOnly: true });
		res.cookie('refresh_token', refreshToken, { httpOnly: true });
		return res.json({ accessToken, refreshToken });
	}

	@Post('logout')
	@ApiBearerAuth('access-token')
	@UseGuards(AuthGuard)
	async logout(@Res() res: Response) {
		// 로그아웃은 AuthGuard만 통과하면 될듯..?
		res.clearCookie('access_token');
		res.clearCookie('refresh_token');
		return res.status(200).send(); // 여기부분이 좀 고민인데 뭘 넘겨줘야 좋을지 모르겠다.
	}

	// User Token Refresh
	@Get('refresh')
	async tokenRefresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ accessToken: string }> {
		const { accessToken } = await this.userService.tokenRefresh(req);
		res.cookie('access_token', accessToken, { httpOnly: true });
		return { accessToken: accessToken };
	}

	// 내정보 확인
	@Get('myInfo')
	@ApiBearerAuth('access-token')
	@UseGuards(AuthGuard, RoleGuard)
	async myInfo(@Req() req: any): Promise<any> {
		return this.userService.getMyDetail(req);
	}

	// 단일 광고주 상세 정보 변경
	@Patch('myInfo')
	@ApiBearerAuth('access-token')
	@UseGuards(AuthGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async updateClientDetail(@Req() req: any, @Body() userDetailReqDto: UserDetailReqDto): Promise<UserDetailResDto> {
		return this.userService.updateMyDetail(req, userDetailReqDto);
	}
}