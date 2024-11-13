import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ClientDetailReqDto {
	@IsString()
	@IsOptional()
	@ApiProperty({ description: '추천인ID', required: false })
	public readonly parent_id?: string;

	@IsBoolean()
	@IsOptional()
	@ApiProperty({ description: '광고주 사용여부', required: false })
	public readonly is_active?: boolean;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '광고주 비밀번호', required: false })
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
