import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { UserStatusResDto } from './dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from './dto/res/user.status.update.res.dto';
import { UserStatusQueryDto } from './dto/user-status-query.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	// 회원가입
	@Post('signup')
	@ApiResponse({ type: SignUpResDto })
	async signUp(@Body() user: SignUpReqDto): Promise<SignUpResDto> {
		return this.usersService.signUp(user);
	}

	// 로그인
	@Post('login')
	async login(@Body() user: LoginReqDto): Promise<{ accessToken: string }> {
		return this.usersService.login(user);
	}

	// 가입 대기/거절 회원 조회
	@Get('status')
	async findUsersByStatus(@Query() query: UserStatusQueryDto): Promise<UserStatusResDto[]> {
		return this.usersService.findUsersByStatus(query.status);
	}

	// 가입 승인(단일, 다중 사용자)
	@Put('approve')
	async approveUsers(
		@Body() userIds: string[],
	): Promise<{ updatedUsers: UserStatusUpdateResDto[]; missingUserIds: string[] }> {
		return this.usersService.updateUserStatus(userIds, 'approved');
	}

	// 가입 거절(단일, 다중 사용자)
	@Put('decline')
	async declineUsers(
		@Body() userIds: string[],
	): Promise<{ updatedUsers: UserStatusUpdateResDto[]; missingUserIds: string[] }> {
		return this.usersService.updateUserStatus(userIds, 'declined');
	}
}
