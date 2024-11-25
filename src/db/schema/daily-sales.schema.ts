import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class DailySales extends Document {
	@Prop({ required: true })
	date: string; // YYYY-MM-DD

	@Prop({ type: Types.ObjectId, ref: 'Advertisement', required: true })
	advertisement_idx: Types.ObjectId;

	@Prop({ required: true })
	sales_amount: number;

	created_at: Date;
}
