import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Req,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {
	ERROR_MESSAGE_DUPLICATE_ID,
	ERROR_MESSAGE_HASH_FAILED,
	ERROR_MESSAGE_INVALID_ROLE,
	ERROR_MESSAGE_STATUS_DECLINED,
	ERROR_MESSAGE_STATUS_PENDING,
	ERROR_MESSAGE_USER_LOGIN_FAILED,
} from '../../common/constants/error-messages';
import { AuthService } from '../auth/auth.service';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { LoginLog } from './schemas/login-log.schema';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(LoginLog.name) private readonly loginLogModel: Model<LoginLog>,
		private readonly authService: AuthService,
	) {}

	//가입
	async signUp(user: SignUpReqDto): Promise<SignUpResDto> {
		const userId = user.user_id;
		const existedUserId = await this.userModel.findOne({ user_id: userId }).exec();

		if (existedUserId) {
			throw new BadRequestException(ERROR_MESSAGE_DUPLICATE_ID);
		}

		// PASS 본인인증 로직 필요 -> client 단계에서 처리하고 넘어오지 않을까 예상하고 작업
		// 비밀번호 해시 및 에러 처리
		const hashedPassword = await bcrypt.hash(user.password, 10).catch(() => {
			throw new InternalServerErrorException(ERROR_MESSAGE_HASH_FAILED);
		});

		// 역할에 따른 승인 상태 및 필드 설정
		if (user.role !== 'admin' && user.role !== 'agency' && user.role !== 'client')
			throw new BadRequestException(ERROR_MESSAGE_INVALID_ROLE);

		// 관리자 또는 총판 역할인 경우 승인 처리 (추후 관리자 계정이 다중계정이 될 때를 고려)
		let status: 'approved' | 'pending' = 'pending';
		if (user.role === 'admin' || user.role === 'agency') status = 'approved';

		// 새로운 사용자 생성
		const newUser = new this.userModel({
			...user,
			password: hashedPassword,
			approved_at: status === 'approved' ? new Date() : undefined,
			status,
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
	async login(user: LoginReqDto, @Req() req: any): Promise<{ accessToken: string }> {
		const userId = user.user_id;
		const password = user.password;

		// 사용자 존재 여부 확인
		const existedUser = await this.userModel.findOne({ user_id: userId }).exec();
		if (!existedUser) {
			throw new UnauthorizedException(ERROR_MESSAGE_USER_LOGIN_FAILED);
		}

		// 승인 상태 확인
		if (existedUser.status === 'declined') {
			throw new UnauthorizedException(ERROR_MESSAGE_STATUS_DECLINED);
		} else if (existedUser.status === 'pending') {
			throw new UnauthorizedException(ERROR_MESSAGE_STATUS_PENDING);
		}

		try {
			const isValidPassword = await bcrypt.compare(password, existedUser.password);
			const IPAddress = req.ip;
			const deviceId = req.headers['user-agent'];
			const loginLog = {
				user_idx: existedUser._id,
				login_timestamp: new Date(),
				login_ip: IPAddress,
				device_id: deviceId,
				login_success: isValidPassword,
			};

			if (!isValidPassword) {
				// 실패 시 최신 `login_failed` 값을 재계산
				const updatedUser = await this.userModel.findById(existedUser._id).exec();
				const updatedLoginFailedCount = (updatedUser?.login_failed || 0) + 1;

				// 실패 로그 추가 및 실패 횟수 증가
				await this.loginLogModel.create(loginLog);
				await this.userModel.updateOne({ _id: existedUser._id }, { $set: { login_failed: updatedLoginFailedCount } });

				throw new UnauthorizedException(ERROR_MESSAGE_USER_LOGIN_FAILED);
			}

			const payload = { userId: userId, role: existedUser.role };
			const accessToken = this.authService.createToken(payload);

			// 로그인 성공 시 로그 추가 및 실패 횟수 초기화
			await this.loginLogModel.create(loginLog);
			await this.userModel.updateOne({ _id: existedUser._id }, { $set: { login_failed: 0 } });

			return { accessToken };
		} catch (error) {
			throw error;
		}
	}
}
