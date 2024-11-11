import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {
	ERROR_MESSAGE_DUPLICATE_ID,
	ERROR_MESSAGE_HASH_FAILED,
	ERROR_MESSAGE_INVALID_ROLE,
	ERROR_MESSAGE_NO_USER_IDS,
	ERROR_MESSAGE_USER_LOGIN_FAILED,
	ERROR_MESSAGE_USERS_NOT_FOUND,
} from '../../common/constants/error-messages';
import { AuthService } from '../auth/auth.service';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { UserStatusResDto } from './dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from './dto/res/user.status.update.res.dto';
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

		let approvedAt = undefined;
		let valid = undefined;

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

	// 가입 대기/거절 회원 조회
	async findUsersByStatus(status: 'pending' | 'declined'): Promise<UserStatusResDto[]> {
		const users = await this.userModel.find({ status }).exec();
		return users.map(user => new UserStatusResDto(user));
	}

	// 가입 상태 업데이트(단일, 다중 사용자 승인 거절)
	async updateUserStatus(
		userIds: string[] | string,
		status: 'approved' | 'declined',
	): Promise<{ updatedUsers: UserStatusUpdateResDto[]; missingUserIds: string[] }> {
		// userIds가 단일 문자열인 경우 배열로 변환
		const idsArray = typeof userIds === 'string' ? [userIds] : userIds;

		// userId가 들어오지 않은 경우 예외 발생
		if (idsArray.length === 0) {
			throw new BadRequestException(ERROR_MESSAGE_NO_USER_IDS);
		}

		// 존재하는 사용자 조회 및 누락된 ID 확인
		const users = await this.userModel.find({ user_id: { $in: idsArray } }).exec();
		const foundUserIds = users.map(user => user.user_id);
		const missingUserIds = idsArray.filter(id => !foundUserIds.includes(id));

		if (missingUserIds.length > 0) {
			throw new NotFoundException(ERROR_MESSAGE_USERS_NOT_FOUND(missingUserIds.join(', ')));
		}

		// 승인 또는 거절 상태에 따른 업데이트 필드 구성
		const updateFields = {
			status,
			approved_at: status === 'approved' ? new Date() : null,
			declined_at: status === 'declined' ? new Date() : null,
		};

		// 존재하는 사용자들에 대해 상태 업데이트
		await this.userModel.updateMany({ user_id: { $in: foundUserIds } }, updateFields).exec();

		// 업데이트 후 최신 사용자 상태 다시 조회
		const updatedUsers = await this.userModel.find({ user_id: { $in: foundUserIds } }).exec();

		return {
			updatedUsers: updatedUsers.map(user => new UserStatusUpdateResDto(user)),
			missingUserIds,
		};
	}
}
