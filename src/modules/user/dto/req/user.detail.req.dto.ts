import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UserDetailReqDto {
	@IsString()
	@IsOptional()
	@ApiProperty({ description: '유저 비밀번호' })
	public readonly password?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '담당자명' })
	public readonly manager_name?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '담당자 연락처' })
	public readonly manager_contact?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '계좌정보: 은행' })
	public readonly account_bank?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '계좌정보: 계좌번호' })
	public readonly account_number?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '계좌정보: 예금주' })
	public readonly account_holder?: string;
}
