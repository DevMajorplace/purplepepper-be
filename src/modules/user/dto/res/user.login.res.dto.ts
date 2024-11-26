import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

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

	@IsBoolean()
	@IsNotEmpty()
	@ApiProperty({ description: '계좌 입력 여부' })
	is_register_account: boolean;

	@IsObject()
	@IsNotEmpty()
	@ApiProperty({ description: '토큰 정보' })
	token: {
		accessToken: string;
		refreshToken: string;
	};

	constructor(user: any) {
		this.company_name = user.company_name;
		this.user_id = user.user_id;
		this.manager_name = user.manager_name;
		this.cash = user.cash;
		this.point = user.point;
		this.role = user.role;
		this.is_register_account = user.is_register_account;
		this.token = user.token;
	}
}
