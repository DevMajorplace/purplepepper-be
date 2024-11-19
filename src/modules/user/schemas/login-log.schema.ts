import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'login_timestamp', updatedAt: false } })
export class LoginLog extends Document {
	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	user_idx: Types.ObjectId; // User 컬렉션의 참조

	@Prop({ required: true })
	login_timestamp: Date;

	@Prop({ required: true })
	login_ip: string;

	@Prop({ required: true })
	device_id: string;

	@Prop({ required: true })
	login_success: boolean;
}

export const LoginLogSchema = SchemaFactory.createForClass(LoginLog);
