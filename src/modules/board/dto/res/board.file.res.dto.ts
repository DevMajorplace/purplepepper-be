import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BoardFileResDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: '파일에 대한 Key', type: String })
	public readonly key: string;

	constructor({ key }: { key: string }) {
		this.key = key;
	}
}
