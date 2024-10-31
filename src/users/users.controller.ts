import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserReqDto } from './dto/req/user.req.dto';
import { UserResDto } from './dto/res/user.res.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@ApiResponse({ type: UserResDto })
	async signUp(@Body() user: UserReqDto): Promise<UserResDto> {
		return this.usersService.signUp(user);
	}
}
