import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AgencyDetailReqDto {
	@IsString()
	@IsOptional()
	@ApiProperty({ description: '총판명', required: false })
	public readonly company_name?: string;

	@IsBoolean()
	@IsOptional()
	@ApiProperty({ description: '총판 사용여부', required: false })
	public readonly is_active?: boolean;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '총판 비밀번호', required: false })
	public readonly password?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '담당자 이름', required: false })
	public readonly manager_name?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '담당자 연락처', required: false })
	public readonly manager_contact?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '업체 계좌정보 - 은행', required: false })
	public readonly account_bank?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '업체 계좌정보 - 계좌번호', required: false })
	public readonly account_number?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '업체 계좌정보 - 예금주', required: false })
	public readonly account_holder?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '관리자메모', required: false })
	public readonly memo?: string;
}
