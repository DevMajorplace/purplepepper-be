import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {
	ERROR_MESSAGE_DUPLICATE_ID,
	ERROR_MESSAGE_HASH_FAILED,
	ERROR_MESSAGE_USER_LOGIN_FAILED,
} from '../../common/constants/error-messages';
import { AuthService } from '../auth/auth.service';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		private readonly authService: AuthService,
	) {}

	//가입
	async signUp(user: SignUpReqDto): Promise<SignUpResDto> {
		const userId = user.user_id;
		const existedUserId = await this.userModel.findOne({ user_id: userId }).exec();

		if (existedUserId) {
			throw new BadRequestException(ERROR_MESSAGE_DUPLICATE_ID);
		}

		// PASS 본인인증 로직 필요
		// 비밀번호 해시 및 에러 처리
		const hashedPassword = await bcrypt.hash(user.password, 10).catch(() => {
			throw new InternalServerErrorException(ERROR_MESSAGE_HASH_FAILED);
		});

		// 역할에 따른 승인 상태 및 필드 설정
		let approvedAt = undefined;
		let valid = undefined;
		let status: 'approved' | 'pending';

		//admin, agency는 바로 승인 (추후 어드민 계정이 다중계정이 될 때를 고려)
		if (user.role === 'admin' || user.role === 'agency') {
			approvedAt = new Date();
			valid = true;
			status = 'approved';
		} else if (user.role === 'client') {
			status = 'pending';
		} else {
			throw new BadRequestException('유효하지 않은 역할입니다.');
		}

		// 새로운 사용자 생성
		const newUser = new this.userModel({
			...user,
			password: hashedPassword,
			approved_at: approvedAt,
			valid: valid,
		});
		await newUser.save();

		// 사업자등록증 S3 전송 및 URL 반환 로직 추가 필요

		// 역할에 따른 상태 값 반환
		return new SignUpResDto({ status });
	}

	// 사용자 찾기
	async findByUserId(userId: string): Promise<User | undefined> {
		return this.userModel.findOne({ user_id: userId }).exec();
	}

	// 로그인
	async login(user: LoginReqDto): Promise<{ accessToken: string }> {
		const userId = user.user_id;
		const password = user.password;

		// 사용자 존재 여부 및 비밀번호 검증
		const existedUser = await this.findByUserId(userId);
		const validatePassword = await bcrypt.compare(password, existedUser.password);
		if (!existedUser || !validatePassword) {
			throw new UnauthorizedException(ERROR_MESSAGE_USER_LOGIN_FAILED);
		}

		const role = existedUser.role;
		const payload = { userId: userId, role: role };

		// 인증, 권한 로직은 모두 auth에서 처리
		const accessToken = this.authService.createToken(payload);

		return { accessToken };
	}
}
