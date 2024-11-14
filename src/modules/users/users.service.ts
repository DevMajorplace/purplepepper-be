import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	Req,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { validatePassword, validateUserId } from 'src/common/utils/validation.util';
import {
	ERROR_MESSAGE_DUPLICATE_ID,
	ERROR_MESSAGE_HASH_FAILED,
	ERROR_MESSAGE_INVALID_ROLE,
	ERROR_MESSAGE_PARENT_NOT_FOUND,
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

	// 상위 회원 3단계까지 찾는 함수
	// 상위 회원 3단계까지 찾는 함수
	private async findHierarchy(userId: string, maxDepth: number = 3): Promise<string[]> {
		const hierarchy: string[] = [];
		let currentUserId = userId;

		for (let i = 0; i < maxDepth; i++) {
			// 상위 추천인 user_id를 찾기
			const user = await this.userModel.findOne({ user_id: currentUserId }).exec();

			// 현재 추천인이 존재하지 않거나 비활성화 상태이면 중단
			if (!user || !user.parent_ids || user.parent_ids.length === 0 || !user.is_active) break;

			// 다음 상위 추천인 user_id를 가져옴
			const nextUserId = user.parent_ids[0];

			// 유효한 추천인 user_id 중 is_active가 true인 경우에만 추가
			const nextUser = await this.userModel.findOne({ user_id: nextUserId, is_active: true }).exec();
			if (!nextUser) break; // 다음 상위 추천인이 존재하지 않거나 비활성화 상태이면 중단

			hierarchy.push(nextUserId);
			currentUserId = nextUserId;
		}

		return hierarchy;
	}

	// 가입
	async signUp(user: SignUpReqDto): Promise<SignUpResDto> {
		const userId = user.user_id;

		// 유저아이디 및 비밀번호 유효성 검사
		validateUserId(userId);
		validatePassword(user.password);

		// 중복 아이디 확인
		const existedUserId = await this.userModel.findOne({ user_id: userId }).exec();
		if (existedUserId) {
			throw new BadRequestException(ERROR_MESSAGE_DUPLICATE_ID);
		}

		// 추천인 아이디가 존재하는 회원인지 확인 및 계층 설정
		let parentIds: string[] = [];
		if (Array.isArray(user.parent_ids) && user.parent_ids.length > 0) {
			const referrerId = user.parent_ids[0];

			// 추천인(user_id) 존재 여부 확인
			const existedParent = await this.userModel.findOne({ user_id: referrerId }).exec();
			if (!existedParent) {
				throw new NotFoundException(ERROR_MESSAGE_PARENT_NOT_FOUND);
			}

			// 추천인 계층을 최대 3단계까지 찾기
			parentIds = [referrerId, ...(await this.findHierarchy(referrerId))];
		}

		// 비밀번호 해시
		const hashedPassword = await bcrypt.hash(user.password, 10).catch(() => {
			throw new InternalServerErrorException(ERROR_MESSAGE_HASH_FAILED);
		});

		// 역할에 따른 승인 상태 설정
		if (!['admin', 'agency', 'client'].includes(user.role)) {
			throw new BadRequestException(ERROR_MESSAGE_INVALID_ROLE);
		}
		const status: 'approved' | 'pending' = ['admin', 'agency'].includes(user.role) ? 'approved' : 'pending';

		// 새로운 사용자 생성
		const newUser = new this.userModel({
			...user,
			password: hashedPassword,
			parent_ids: parentIds.slice(0, 3), // 최대 3단계까지 저장
			approved_at: status === 'approved' ? new Date() : undefined,
			status,
		});
		await newUser.save();

		return new SignUpResDto({ status });
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
