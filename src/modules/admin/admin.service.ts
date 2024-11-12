import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERROR_MESSAGE_NO_USER_IDS, ERROR_MESSAGE_USERS_NOT_FOUND } from '../../common/constants/error-messages';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from '../admin/dto/res/user.status.update.res.dto';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
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
}
