import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class AgencyDetailResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체명' })
	public readonly company_name: string;

	@IsBoolean()
	@IsNotEmpty()
	@ApiProperty({ description: '총판 사용여부', default: true })
	public readonly is_active: boolean;

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
	@IsNotEmpty()
	@ApiProperty({ description: '업체 계좌정보 - 은행' })
	public readonly account_bank?: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체 계좌정보 - 계좌번호' })
	public readonly account_number?: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체 계좌정보 - 예금주' })
	public readonly account_holder?: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '관리자메모' })
	public readonly memo: string;

	constructor(user: any) {
		this.company_name = user.company_name;
		this.is_active = user.is_active;
		this.user_id = user.user_id;
		this.manager_name = user.manager_name;
		this.manager_contact = user.manager_contact;
		this.account_bank = user.account_bank ?? null;
		this.account_number = user.account_number ?? null;
		this.account_holder = user.account_holder ?? null;
		this.memo = user.memo ?? null;
	}
}
