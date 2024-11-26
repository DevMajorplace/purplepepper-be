import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class MonthlySales extends Document {
	@Prop({ required: true })
	month: string; // YYYY-MM

	@Prop({ required: true })
	sales_amount: number;

	@Prop({ required: true })
	target_sales: number;

	created_at: Date;
}
