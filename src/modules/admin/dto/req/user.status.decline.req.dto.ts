import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UsersStatusDeclineReqDto {
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true }) // 배열의 각 요소가 문자열인지 확인
	@ApiProperty({
		description: '승인/거절할 사용자 ID 배열',
		example: ['user1'],
	})
	public readonly user_ids!: string[];

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: '거절사유',
		example: '계약 취소',
		required: false,
	})
	public readonly rejection_reason?: string;
}
