import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class UserLoginResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '회사명' })
	company_name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '아이디' })
	user_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '담당자명' })
	manager_name: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '캐시' })
	cash: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '포인트' })
	point: number;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '역할' })
	role: string;

	@IsObject()
	@IsNotEmpty()
	@ApiProperty({ description: '토큰 정보' })
	token: {
		accessToken: string;
		refreshToken: string;
	};
}
