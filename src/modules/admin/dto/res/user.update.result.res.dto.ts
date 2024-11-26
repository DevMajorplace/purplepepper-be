import { ApiProperty } from '@nestjs/swagger';
import { FailedUserDto } from './failed.user.res.dto';
import { UserStatusUpdateResDto } from './user.status.update.res.dto';

export class UsersUpdateResultResDto {
	@ApiProperty({ type: [UserStatusUpdateResDto], description: '업데이트된 사용자 목록' })
	public readonly success: UserStatusUpdateResDto[];

	@ApiProperty({ type: [FailedUserDto], description: '업데이트 실패한 사용자 목록' })
	public readonly failed: FailedUserDto[];

	constructor(success: UserStatusUpdateResDto[], failed: FailedUserDto[]) {
		this.success = success;
		this.failed = failed;
	}
}
