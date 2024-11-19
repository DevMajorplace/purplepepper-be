import { Body, Controller, Get, Patch, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { UserDetailReqDto } from './dto/req/user.detail.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { UserDetailResDto } from './dto/res/user.detail.res.dto';
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
	async login(@Body() user: LoginReqDto, @Req() req: any): Promise<{ accessToken: string }> {
		return this.usersService.login(user, req);
	}

	// 내정보 확인
	@Get('myInfo')
	@ApiBearerAuth('access-token')
	@UseGuards(AuthGuard, RoleGuard)
	async myInfo(@Req() req: any): Promise<any> {
		return this.usersService.getMyDetail(req);
	}

	// 단일 광고주 상세 정보 변경
	@Patch('myInfo')
	@ApiBearerAuth('access-token')
	@UseGuards(AuthGuard)
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async updateClientDetail(@Req() req: any, @Body() userDetailReqDto: UserDetailReqDto): Promise<UserDetailResDto> {
		return this.usersService.updateMyDetail(req, userDetailReqDto);
	}
}
