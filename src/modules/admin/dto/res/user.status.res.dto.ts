import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import * as moment from 'moment-timezone';

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

	@IsString()
	@ApiProperty({ description: '가입요청일시' })
	public readonly created_at: string;

	@IsString()
	@ApiProperty({ description: '사업자등록증' })
	public readonly business_registration: string;

	constructor(user: any) {
		this.user_id = user.user_id;
		this.company_name = user.company_name;
		this.manager_name = user.manager_name;
		this.manager_contact = user.manager_contact;
		this.parent_id = user.parent_ids?.[0] ?? null;
		this.created_at = moment.tz(user.created_at, 'Asia/Seoul').format('YYYY-MM-DDTHH:mm:ss[Z]');
		this.business_registration = user.business_registration;
	}
}
