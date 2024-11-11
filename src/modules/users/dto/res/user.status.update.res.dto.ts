import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserStatusUpdateResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체명' })
	public readonly company_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자명' })
	public readonly manager_name: string;

	@IsString()
	@ApiProperty({ description: '상위 회원' })
	public readonly parent_id: string;

	@IsString()
	@ApiProperty({ description: '상태' })
	public readonly status: string;

	constructor(user: any) {
		this.company_name = user.company_name;
		this.manager_name = user.manager_name;
		this.parent_id = user.parent_ids?.[0] ?? null; // parent_ids 배열에서 첫 번째 ID 추출
		this.status = user.status;
	}
}
