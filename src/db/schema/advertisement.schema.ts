import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// 상품 스키마는 캐시 이용/충전내역 조회를 위해 일단 임시 개념으로 생성
@Schema({ timestamps: { createdAt: 'created_at' } })
export class Advertisement extends Document {
	@Prop({ type: Number, required: true, unique: true })
	objectId: number;

	@Prop({ type: String, required: true })
	title: string;

	@Prop({ type: String, required: true })
	description: string;

	@Prop({ type: Number, required: true })
	mission_idx: number; // 미션 IDX (Ref: missions.objectId)

	@Prop({ type: Number, required: true })
	media_company_idx: number; // 매체사 IDX (Ref: media_companies.objectId)

	@Prop({ type: Number, required: true })
	user_idx: number; // 사용자 IDX (Ref: users.objectId)

	@Prop({ type: String, required: true })
	advertisement_url: string;

	@Prop({ type: Number, required: true })
	daily_target: number;

	@Prop({ type: Number, required: true })
	total_target: number;

	@Prop({ type: [String], default: [] })
	search_keywords: string[];

	@Prop({ type: [String], default: [] })
	search_urls: string[];

	@Prop({ type: Boolean, default: false })
	is_duplicatable: boolean;

	@Prop({
		type: [String],
		enum: ['진행중', '일시정지', '종료'],
		required: true,
	})
	status: string[]; // 광고 상태

	@Prop({ type: Date, required: true })
	start_date: Date;

	@Prop({ type: Date, required: true })
	end_date: Date;

	@Prop({ type: Date, default: null })
	deleted_at?: Date;

	created_at: Date;
}

export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);
