import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserDetailResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체명' })
	public readonly company_name: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '상위 회원', required: false })
	public readonly parent_id?: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 아이디' })
	public readonly user_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자명' })
	public readonly manager_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자 연락처' })
	public readonly manager_contact: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '계좌정보: 은행' })
	public readonly account_bank: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '계좌정보: 계좌번호' })
	public readonly account_number: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '계좌정보: 예금주' })
	public readonly account_holder: string;

	constructor(user: any, role: string) {
		this.company_name = user.company_name;
		this.user_id = user.user_id;
		this.manager_name = user.manager_name;
		this.manager_contact = user.manager_contact;
		this.account_bank = user.account_bank;
		this.account_number = user.account_number;
		this.account_holder = user.account_holder;
		// role이 client일 때만 parent_id 설정
		this.parent_id = role === 'client' ? (user.parent_ids?.[0] ?? null) : undefined;
	}
}
