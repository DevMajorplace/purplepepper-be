import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ClientListResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 아이디' })
	public readonly user_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체명' })
	public readonly company_name: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '보유 캐시' })
	public readonly cash: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '보유 포인트' })
	public readonly point: number;

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
	@ApiProperty({ description: '등록 일시' })
	public readonly approved_at: Date;

	@IsDate()
	@ApiProperty({ description: '마지막 로그인' })
	public readonly last_login: Date;

	constructor(user: any, lastLoginTimestamp: Date | null) {
		this.user_id = user.user_id;
		this.company_name = user.company_name;
		this.cash = user.cash;
		this.point = user.point;
		this.manager_name = user.manager_name;
		this.manager_contact = user.manager_contact;
		this.parent_id = user.parent_ids?.[0] ?? null;
		this.approved_at = user.approved_at ?? null;
		this.last_login = lastLoginTimestamp;
	}
}
