import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { FindUserDataReqDto } from './dto/req/find.user.data.req.dto';
import { LoginReqDto } from './dto/req/login.req.dto';
import { ResetPasswordReqDto } from './dto/req/reset.password.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { UserDetailReqDto } from './dto/req/user.detail.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { UserDetailResDto } from './dto/res/user.detail.res.dto';
import { UserLoginResDto } from './dto/res/user.login.res.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	// 회원가입
	@Post('/')
	@ApiResponse({ type: SignUpResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async signUp(@Body() user: SignUpReqDto): Promise<SignUpResDto> {
		return this.userService.signUp(user);
	}

	// 로그인
	@Post('login')
	@ApiResponse({ type: UserLoginResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async login(@Body() user: LoginReqDto, @Req() req: any, @Res() res: Response) {
		const loginResponse = await this.userService.login(user, req);
		const { token } = loginResponse;
		res.cookie('access_token', token.accessToken);
		res.cookie('refresh_token', token.refreshToken);
		return res.json(loginResponse);
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
	@Get('refresh-token')
	async tokenRefresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ accessToken: string }> {
		const { accessToken } = await this.userService.tokenRefresh(req);
		res.cookie('access_token', accessToken);
		return { accessToken: accessToken };
	}

	// 내정보 확인
	@Get('my-info')
	@ApiBearerAuth('access-token')
	@UseGuards(AuthGuard, RoleGuard)
	@ApiResponse({ type: UserDetailResDto })
	async myInfo(@Req() req: any): Promise<any> {
		return this.userService.getMyDetail(req);
	}

	// 단일 광고주 상세 정보 변경
	@Patch('my-info')
	@ApiBearerAuth('access-token')
	@UseGuards(AuthGuard)
	@ApiResponse({ type: UserDetailResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async updateClientDetail(@Req() req: any, @Body() userDetailReqDto: UserDetailReqDto): Promise<UserDetailResDto> {
		return this.userService.updateMyDetail(req, userDetailReqDto);
	}

	// 아이디 찾기
	@Post('find/id')
	async findUserId(@Body() findUserDataReqDto: FindUserDataReqDto): Promise<{ userId: string }> {
		return this.userService.findUserId(findUserDataReqDto);
	}

	// 비밀번호 찾기
	@Post('find/password')
	async findUserPassword(@Res() res: Response, @Body() findUserDataReqDto: FindUserDataReqDto) {
		// 성공 시 해당 사용자 데이터에 임시 접근 가능한 token을 발급
		const { resetToken } = await this.userService.findUserPassword(findUserDataReqDto);
		res.cookie('reset_token', resetToken);
		return res.json({ resetToken: resetToken });
	}

	// 비밀번호 재설정
	@Patch('reset/password')
	@ApiBearerAuth('access-token')
	async updateUserPassword(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) resetPasswordReqDto: ResetPasswordReqDto,
	) {
		const { password } = resetPasswordReqDto;
		const resetStatus = await this.userService.resetUserPassword(req, password);
		res.clearCookie('reset_token');
		return resetStatus;
	}
}
