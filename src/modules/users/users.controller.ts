import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@ApiResponse({ type: SignUpResDto })
	async signUp(@Body() user: SignUpReqDto): Promise<SignUpResDto> {
		return this.usersService.signUp(user);
	}

	// 로그인
	@Post('login')
	async login(@Body() user: LoginReqDto): Promise<{ accessToken: string }> {
		return this.usersService.login(user);
	}
}
