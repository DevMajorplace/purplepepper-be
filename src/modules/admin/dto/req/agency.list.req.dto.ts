import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AgencyListReqDto {
	@IsDateString()
	@IsOptional()
	@ApiProperty({ description: '가입 승인일 검색 시작일', required: false })
	public readonly approve_start_date?: Date;

	@IsDateString()
	@IsOptional()
	@ApiProperty({ description: '가입 승인일 검색 종료일', required: false })
	public readonly approve_end_date?: Date;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: '업체명', required: false })
	public readonly company_name?: string;
}
