import { ApiProperty } from '@nestjs/swagger';

export class FailedUserDto {
	@ApiProperty({ description: '사용자 ID' })
	public readonly user_id: string;

	@ApiProperty({ description: '실패 사유' })
	public readonly reason: string;

	constructor(userId: string, reason: string) {
		this.user_id = userId;
		this.reason = reason;
	}
}
