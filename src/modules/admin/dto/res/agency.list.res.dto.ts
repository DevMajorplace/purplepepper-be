import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AgencyListResDto {
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
	@ApiProperty({ description: '회원 수', default: 0 })
	public readonly numberOfUsers: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '전일 대비 회원 증가수', default: 0 })
	public readonly dailyMemberGrowth: number;

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

	@IsDate()
	@IsNotEmpty()
	@ApiProperty({ description: '등록 일시' })
	public readonly approved_at: Date;

	constructor(user: any) {
		this.user_id = user.user_id;
		this.company_name = user.company_name;
		this.numberOfUsers = user.numberOfUsers ?? 0;
		this.dailyMemberGrowth = user.dailyMemberGrowth ?? 0;
		this.point = user.point;
		this.manager_name = user.manager_name;
		this.manager_contact = user.manager_contact;
		this.approved_at = user.approved_at ?? null;
	}
}
