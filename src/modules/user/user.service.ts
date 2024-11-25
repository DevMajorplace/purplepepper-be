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
import { Request } from 'express';
import { Model } from 'mongoose';
import { validHierarchy, validatePassword, validateUserId } from 'src/common/utils/validation.util';
import {
	ERROR_MESSAGE_DUPLICATE_ID,
	ERROR_MESSAGE_HASH_FAILED,
	ERROR_MESSAGE_INVALID_ROLE,
	ERROR_MESSAGE_INVALID_TOKEN,
	ERROR_MESSAGE_NO_TOKEN,
	ERROR_MESSAGE_PARENT_NOT_FOUND,
	ERROR_MESSAGE_PERMISSION_DENIED,
	ERROR_MESSAGE_STATUS_DECLINED,
	ERROR_MESSAGE_STATUS_PENDING,
	ERROR_MESSAGE_USER_LOGIN_FAILED,
	ERROR_MESSAGE_USER_NOT_FOUND,
} from '../../common/constants/error-messages';
import { AuthService } from '../auth/auth.service';
import { FindUserDataReqDto } from './dto/req/find.user.data.req.dto';
import { LoginReqDto } from './dto/req/login.req.dto';
import { SignUpReqDto } from './dto/req/signup.req.dto';
import { UserDetailReqDto } from './dto/req/user.detail.req.dto';
import { SignUpResDto } from './dto/res/signup.res.dto';
import { UserDetailResDto } from './dto/res/user.detail.res.dto';
import { UserLoginResDto } from './dto/res/user.login.res.dto';
import { LoginLog } from './schemas/login-log.schema';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(LoginLog.name) private readonly loginLogModel: Model<LoginLog>,
		private readonly authService: AuthService,
	) {}

	// 가입
	async signUp(user: SignUpReqDto): Promise<SignUpResDto> {
		const userId = user.user_id;

		// 유저아이디 및 비밀번호 유효성 검사
		validateUserId(userId);
		validatePassword(user.password);
		console.log(validateUserId(userId));

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
			parentIds = [referrerId, ...(await validHierarchy(referrerId, this.userModel))];
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
	async login(user: LoginReqDto, @Req() req: any): Promise<UserLoginResDto> {
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
			const accessToken = this.authService.createToken(payload, 'access');

			// 로그인 성공 시 로그 추가 및 실패 횟수 초기화
			await this.loginLogModel.create(loginLog);
			await this.userModel.updateOne({ _id: existedUser._id }, { $set: { login_failed: 0 } });

			const refreshToken = this.authService.createToken({ userId: userId }, 'refresh');

			return {
				company_name: existedUser.company_name,
				user_id: existedUser.user_id,
				manager_name: existedUser.manager_name,
				cash: existedUser.cash,
				point: existedUser.point,
				role: existedUser.role,
				token: { accessToken, refreshToken },
			};
		} catch (error) {
			throw error;
		}
	}

	async tokenRefresh(@Req() req: Request): Promise<{ accessToken: string }> {
		const token = req.cookies?.refresh_token;
		if (!token) throw new UnauthorizedException(ERROR_MESSAGE_NO_TOKEN);

		const { userId } = this.authService.verifyToken(token, 'refresh');
		if (!userId) throw new UnauthorizedException(ERROR_MESSAGE_INVALID_TOKEN);

		const user = await this.userModel.findOne({ user_id: userId }).exec();
		if (!user) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}

		return { accessToken: this.authService.createToken({ userId: user.user_id, role: user.role }, 'access') };
	}

	// 내 정보 확인
	async getMyDetail(@Req() req: any): Promise<UserDetailResDto> {
		const userId = req.user.userId;
		const role = req.user.role;

		// 사용자 정보 조회
		const user = await this.userModel.findOne({ user_id: userId }).exec();
		if (!user) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}

		// 총판은 상위 회원 정보 반환하지 않음
		const myInfo: Partial<UserDetailResDto> = {
			company_name: user.company_name,
			user_id: user.user_id,
			manager_name: user.manager_name,
			manager_contact: user.manager_contact,
			account_bank: user.account_bank,
			account_number: user.account_number,
			account_holder: user.account_holder,
			// role이 client일 때만 parent_id 추가
			...(role === 'client' ? { parent_id: user.parent_ids?.[0] ?? null } : {}),
		};

		return new UserDetailResDto(myInfo, role);
	}

	// 내 정보 변경
	async updateMyDetail(@Req() req: any, detailReqDto: UserDetailReqDto): Promise<UserDetailResDto> {
		const userId = req.user.userId;
		const role = req.user.role;
		// 사용자 정보 조회
		const user = await this.userModel.findOne({ user_id: userId }).exec();
		if (!user) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}

		// 비밀번호 변경 시 비밀번호 정책 검사
		const updateFields: any = {};
		if (detailReqDto.password) {
			validatePassword(detailReqDto.password); // 비밀번호 정책 검사

			const isSamePassword = await bcrypt.compare(detailReqDto.password, user.password);
			if (!isSamePassword) {
				updateFields.password = await bcrypt.hash(detailReqDto.password, 10); // 비밀번호 해싱
			}
		}

		// null이나 undefined가 아니면 변경으로 인식
		Object.entries(detailReqDto).forEach(([key, value]) => {
			if (
				value !== undefined && // 값이 정의되어 있고
				value !== null && // null이 아니며
				key !== 'password' // 비밀번호는 별도로 처리했으므로 제외
			) {
				updateFields[key] = value;
			}
		});

		if (Object.keys(updateFields).length === 0) {
			// 변경 사항이 없으므로, 현재 사용자 정보 그대로 반환
			return new UserDetailResDto(user, role);
		}

		// 변경된 정보 업데이트 및 반환
		const updatedUser = await this.userModel
			.findOneAndUpdate(
				{ _id: user._id },
				{ $set: updateFields },
				{ new: true }, // 업데이트된 문서를 반환
			)
			.exec();

		return new UserDetailResDto(updatedUser, role);
	}

	async findUserId(findUserDataReqDto: FindUserDataReqDto): Promise<{ userId: string }> {
		const { manager_name, manager_contact } = findUserDataReqDto;
		if (!manager_name || !manager_contact) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}

		const user = await this.userModel.findOne({ manager_name: manager_name, manager_contact: manager_contact }).exec();
		if (!user) throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);

		return { userId: user.user_id };
	}

	async findUserPassword(findUserDataReqDto: FindUserDataReqDto): Promise<{ resetToken: string }> {
		const { user_id, manager_name, manager_contact } = findUserDataReqDto;
		if (!user_id || !manager_name || !manager_contact) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}

		const user = await this.userModel.findOne({ manager_name: manager_name, manager_contact: manager_contact }).exec();
		if (!user) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}

		const payload = { userId: user.user_id, resetToken: true };
		return { resetToken: this.authService.createToken(payload, 'reset') };
	}

	async resetUserPassword(@Req() req: Request, password: string): Promise<{ status: string }> {
		validatePassword(password);
		const token = req.cookies?.reset_token;
		if (!token) throw new UnauthorizedException(ERROR_MESSAGE_NO_TOKEN);

		const { userId, resetToken } = this.authService.verifyToken(token, 'reset');
		if (!userId) throw new UnauthorizedException(ERROR_MESSAGE_INVALID_TOKEN);
		if (!resetToken) throw new UnauthorizedException(ERROR_MESSAGE_PERMISSION_DENIED);

		const user = await this.userModel.findOne({ user_id: userId }).exec();
		if (!user) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}

		const hashedPassword = await bcrypt.hash(password, 10).catch(() => {
			throw new InternalServerErrorException(ERROR_MESSAGE_HASH_FAILED);
		});
		await this.userModel.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

		return { status: 'success' };
	}
}
