import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	ERROR_MESSAGE_COMPANY_NOT_FOUND,
	ERROR_MESSAGE_NO_USER_IDS,
	ERROR_MESSAGE_USERS_NOT_FOUND,
} from '../../common/constants/error-messages';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from '../admin/dto/res/user.status.update.res.dto';
import { AuthService } from '../auth/auth.service';
import { LoginLog } from '../users/schemas/login-log.schema';
import { User } from '../users/schemas/user.schema';
import { ClientNameReqDto } from './dto/req/client.name.req.dto';
import { RangeReqDto } from './dto/req/range.req.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(LoginLog.name) private readonly loginLogModel: Model<LoginLog>,
		private readonly authService: AuthService,
	) {}

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

		// 이미 요청한 상태와 동일한 경우 업데이트 생략
		const usersToUpdate = users.filter(user => user.status !== status);
		const updateFields = {
			status,
			approved_at: status === 'approved' ? new Date() : null,
			declined_at: status === 'declined' ? new Date() : null,
		};

		// 업데이트할 사용자가 있는 경우에만 상태 업데이트
		if (usersToUpdate.length > 0) {
			const userIdsToUpdate = usersToUpdate.map(user => user.user_id);
			await this.userModel.updateMany({ user_id: { $in: userIdsToUpdate } }, updateFields).exec();
		}

		// 업데이트 후 최신 사용자 상태 다시 조회
		const updatedUsers = await this.userModel.find({ user_id: { $in: foundUserIds } }).exec();

		return {
			updatedUsers: updatedUsers.map(user => new UserStatusUpdateResDto(user)),
			missingUserIds,
		};
	}

	// 가입된 광고주 조건/전체 조회
	async getClients(rangeReqDto?: RangeReqDto): Promise<ClientListResDto[]> {
		// 기본 검색 조건 설정
		const query: any = {
			status: 'approved',
			role: 'client',
		};

		// 가입 승인일 필터링 조건 설정
		if (rangeReqDto?.approve_start_date || rangeReqDto?.approve_end_date) {
			query.approved_at = {};
			if (rangeReqDto.approve_start_date) {
				query.approved_at.$gte = rangeReqDto.approve_start_date; // 시작일 기준
			}
			if (rangeReqDto.approve_end_date) {
				query.approved_at.$lte = rangeReqDto.approve_end_date; // 종료일 기준
			}
		}

		// 광고주 목록 가져오기
		const users = await this.userModel.find(query).exec();

		// 최종 광고주 리스트 생성
		const clientList = await Promise.all(
			users.map(async user => {
				// 마지막 로그인 기록 조회 (로그인 성공만)
				const lastLogin = await this.loginLogModel
					.findOne({ user_idx: user._id, login_success: true })
					.sort({ login_timestamp: -1 })
					.exec();

				const lastLoginTimestamp = lastLogin ? new Date(lastLogin.login_timestamp) : null;

				// 마지막 로그인 범위 필터링 조건 적용
				if (rangeReqDto?.last_login_start_date || rangeReqDto?.last_login_end_date) {
					const lastLoginStart = rangeReqDto.last_login_start_date ? new Date(rangeReqDto.last_login_start_date) : null;
					const lastLoginEnd = rangeReqDto.last_login_end_date ? new Date(rangeReqDto.last_login_end_date) : null;

					// 조건에 맞지 않으면 결과에서 제외
					if (
						(lastLoginStart && (!lastLoginTimestamp || lastLoginTimestamp < lastLoginStart)) ||
						(lastLoginEnd && (!lastLoginTimestamp || lastLoginTimestamp > lastLoginEnd))
					) {
						return null; // 조건에 맞지 않으면 null 반환하여 이후 필터링 단계에서 제외
					}
				}

				return new ClientListResDto(user, lastLoginTimestamp);
			}),
		);

		return clientList.filter(client => client !== null);
	}

	// 광고주 업체명 조회
	async getClientsByName(clientNameReqDto: ClientNameReqDto): Promise<ClientListResDto[]> {
		// 회사명이 같은 모든 사용자 조회
		const users = await this.userModel.find({ company_name: clientNameReqDto.company_name }).exec();
		if (!users || users.length === 0) {
			throw new NotFoundException(ERROR_MESSAGE_COMPANY_NOT_FOUND);
		}

		// 각 사용자에 대해 마지막 로그인 정보를 포함한 ClientListResDto 생성
		const clientList = await Promise.all(
			users.map(async user => {
				const lastLogin = await this.loginLogModel
					.findOne({ user_idx: user._id, login_success: true })
					.sort({ login_timestamp: -1 })
					.exec();

				const lastLoginTimestamp = lastLogin ? lastLogin.login_timestamp : null;

				return new ClientListResDto(user, lastLoginTimestamp);
			}),
		);

		return clientList;
	}
}
