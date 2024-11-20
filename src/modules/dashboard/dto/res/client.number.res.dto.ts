import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ClientStatResDto {
	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '광고주 수' })
	public readonly clientsCount: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '증가율' })
	public readonly growthRate: number;

	constructor(partial: Partial<ClientStatResDto>) {
		Object.assign(this, partial);
	}
}
