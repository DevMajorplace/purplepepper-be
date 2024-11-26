import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class User extends Document {
	@Prop({ required: true })
	company_name: string;

	@Prop({ required: true, unique: true })
	user_id: string;

	@Prop({ required: true })
	password: string;

	@Prop({ required: true })
	manager_name: string;

	@Prop({ required: true, unique: true })
	manager_contact: string;

	@Prop({ default: 0 })
	monthly_target_sales: number;

	@Prop({ type: [String], ref: 'User', default: [] })
	parent_ids: string[];

	@Prop({ enum: ['admin', 'agency', 'client'], required: true })
	role: string;

	@Prop({ default: 0 })
	cash: number;

	@Prop({ default: 0 })
	point: number;

	@Prop()
	account_bank: string;

	@Prop()
	account_number: string;

	@Prop()
	account_holder: string;

	@Prop()
	business_registration?: string; // 사업자등록증 S3 링크

	@Prop()
	memo: string;

	@Prop({ default: true, required: true })
	is_active: boolean;

	@Prop({ enum: ['approved', 'pending', 'declined'], required: true })
	status: string;

	@Prop({ default: 0 })
	login_failed: number;

	@Prop()
	approved_at: Date;

	@Prop()
	declined_at: Date;

	@Prop()
	deleted_at: Date;

	readonly created_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
