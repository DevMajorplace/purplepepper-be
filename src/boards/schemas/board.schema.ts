import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Board extends Document {
	@Prop({ type: String, required: true })
	category: string;

	@Prop({ required: true })
	title: string;

	@Prop()
	content: string;

	@Prop({ type: [String], default: [] })
	visible: string[]; // ['admin', 'agency', 'client']

	@Prop({ type: [String], default: [] })
	file_urls: string[];

	@Prop({ type: Date, default: null })
	deleted_at?: Date;

	@Prop({ type: Date, default: null })
	updated_at?: Date;

	created_at: Date;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
