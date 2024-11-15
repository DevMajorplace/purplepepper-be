import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ClientNumberResDto {
	@IsNumber()
	@IsNotEmpty()
	@ApiProperty({ description: '광고주 수' })
	public readonly clientsCount: number;

	constructor(partial: Partial<ClientNumberResDto>) {
		Object.assign(this, partial);
	}
}
