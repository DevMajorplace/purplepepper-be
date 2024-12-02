import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BusinessRegistrationResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'file id' })
	public readonly file_id: string;

	constructor(partial: Partial<BusinessRegistrationResDto>) {
		Object.assign(this, partial);
	}
}
