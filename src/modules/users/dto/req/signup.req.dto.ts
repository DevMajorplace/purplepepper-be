import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/modules/auth/types/role.enum';

export class SignUpReqDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '업체명' })
	public readonly company_name: string;

	@IsBoolean()
	@IsNotEmpty()
	@ApiProperty({ description: '광고주 사용여부', default: true })
	public readonly is_active: boolean;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 아이디' })
	public readonly user_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '유저 비밀번호' })
	public readonly password: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자명' })
	public readonly manager_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자 연락처' })
	public readonly manager_contact: string;

	@IsArray()
	@IsOptional()
	@ApiProperty({ description: '상위 회원 배열', required: false })
	public readonly parent_ids: string[];

	@IsEnum(Role)
	@IsNotEmpty()
	@ApiProperty({ description: '역할 - admin, agency, client' })
	public readonly role: Role;

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

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '사업자등록증 S3 링크' })
	public readonly business_registration: string;
}
