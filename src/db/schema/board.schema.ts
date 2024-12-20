import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from 'src/modules/auth/types/role.enum';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Board extends Document {
	@Prop({ type: String, required: true })
	category: string; // 카테고리 확실해지면 enum 으로 수정 예정

	@Prop({ required: true })
	title: string;

	@Prop({ required: true })
	content: string;

	@Prop({ type: [String], default: ['admin'] })
	visible: Role[]; // ['admin', 'agency', 'client']

	@Prop({ type: [String], default: [] })
	file_keys: string[];

	@Prop({ type: Date })
	deleted_at?: Date;

	created_at: Date;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
