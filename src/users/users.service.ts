import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserReqDto } from './dto/req/user.req.dto';
import { UserResDto } from './dto/res/user.res.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		private readonly configService: ConfigService
	) {}

	//가입
	async signUp(user: UserReqDto): Promise<UserResDto> {
		const userId = user.user_id;
		const existedUserId = await this.userModel.findOne({ user_id: userId }).exec();

		if (existedUserId) {
			throw new BadRequestException('이미 존재하는 아이디입니다.');
		}

		// 비밀번호 해시 및 에러 처리
		const hashedPassword = await bcrypt.hash(user.password, 10).catch(() => {
			throw new InternalServerErrorException('비밀번호 해싱에 실패했습니다.');
		});

		// 새로운 사용자 생성
		const newUser = new this.userModel({
			...user,
			password: hashedPassword,
			approved_at: user.role === 'agency' ? new Date() : undefined, // agency의 경우 승인일 설정
			valid: user.role === 'agency' ? true : false // agency의 경우 가입시 바로 승인
		});
		await newUser.save();

		// 역할에 따른 상태 값 반환
		const status = user.role === 'agency' ? 'approved' : 'pending';
		return new UserResDto({ status });
	}
}
