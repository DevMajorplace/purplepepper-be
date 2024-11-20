import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CashLogCategory, CashLogStatus, CashLogType } from '../types/cash-log.enum';

@Schema({ timestamps: { createdAt: 'created_at' } })
export class CashLog extends Document {
	@Prop({ type: String, required: true })
	user_idx: string; // 사용자 IDX

	@Prop({ type: String, default: null })
	advertise_idx?: string; // 상품 IDX

	@Prop({ type: String, default: null })
	mission_idx?: string; // 미션 IDX

	@Prop({ type: String, enum: CashLogType, required: true })
	type: CashLogType; // '환급' | '사용'

	@Prop({ type: String, enum: CashLogCategory, required: true })
	category: CashLogCategory; // '충전' | '환불' | '미션등록'

	@Prop({ type: String, required: true })
	depositor: string; // 입금자명

	@Prop({ type: Number, required: true })
	amount: number; // 요청 금액

	@Prop({ type: String, enum: CashLogStatus, default: CashLogStatus.PENDING, required: true })
	status: CashLogStatus; // '대기' | '승인' | '거절' | '오류'

	@Prop({ type: String, default: null })
	error_reason?: string; // 오류 사유

	@Prop({ type: String, default: null })
	rejection_reason?: string; // 거절 사유

	@Prop({ type: Date, default: null })
	approved_at?: Date; // 승인 날짜

	@Prop({ type: Date, default: null })
	declined_at?: Date; // 거절 날짜

	created_at: Date;
}

export const CashLogSchema = SchemaFactory.createForClass(CashLog);
