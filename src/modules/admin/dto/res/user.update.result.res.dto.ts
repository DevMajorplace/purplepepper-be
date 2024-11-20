import { ApiProperty } from '@nestjs/swagger';
import { UserStatusUpdateResDto } from './user.status.update.res.dto';

export class UsersUpdateResultResDto {
	@ApiProperty({ type: [UserStatusUpdateResDto], description: '업데이트된 사용자 목록' })
	public readonly updatedUsers: UserStatusUpdateResDto[];

	@ApiProperty({ type: [String], description: '존재하지 않는 사용자 ID 목록' })
	public readonly missingUserIds: string[];

	constructor(updatedUsers: UserStatusUpdateResDto[], missingUserIds: string[]) {
		this.updatedUsers = updatedUsers;
		this.missingUserIds = missingUserIds;
	}
}
