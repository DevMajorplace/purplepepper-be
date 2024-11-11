import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class UserStatusResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 아이디' })
	public readonly user_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체명' })
	public readonly company_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자명' })
	public readonly manager_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자 연락처' })
	public readonly manager_contact: string;

	@IsString()
	@ApiProperty({ description: '상위 회원' })
	public readonly parent_id: string;

	@IsDate()
	@ApiProperty({ description: '가입요청일시' })
	public readonly created_at: Date;

	@IsString()
	@ApiProperty({ description: '사업자등록증' })
	public readonly business_registration: string;

	constructor(user: any) {
		this.user_id = user.user_id;
		this.company_name = user.company_name;
		this.manager_name = user.manager_name;
		this.manager_contact = user.manager_contact;
		this.parent_id = user.parent_ids?.[0] ?? null;
		this.created_at = user.created_at;
		this.business_registration = user.business_registration;
	}
}
