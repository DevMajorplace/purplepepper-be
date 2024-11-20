import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class CashRequestListReqDto {
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	@ApiProperty({
		description: '충전 승인/거절할 캐시로그 IDX 배열',
		example: ['673d3ad03751273c6919f3ff'],
	})
	public readonly cashLogIdx!: string[];

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: '거절사유. 거절시에만 사용',
		example: '거절사유',
	})
	public readonly rejection_reason?: string;
}
