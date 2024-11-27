import * as moment from 'moment-timezone';
import { Model } from 'mongoose';
import { User } from 'src/db/schema/user.schema';

// 기본 조건 + 업체명 검색 함수
export function setBaseQuery(role: string, dto: any, parentId?: string) {
	const query: any = {
		status: 'approved',
		role: role,
		is_active: true,
	};

	// 업체명 부분 검색 필터링 조건 설정
	if (dto?.company_name) {
		query.company_name = { $regex: dto.company_name, $options: 'i' }; // 대소문자 구분 없이 부분 일치 검색
	}

	// parent_ids 조건 추가 (총판일 경우만)
	if (parentId) {
		query.parent_ids = { $in: [parentId] }; // parent_ids 배열에 parentId가 포함된 경우
	}

	return query;
}

// 가입 승인일 필터링 함수
export function setApprovedDateQuery(dto: any, query: any) {
	if (dto?.approve_start_date || dto?.approve_end_date) {
		query.approved_at = {};
		if (dto.approve_start_date) {
			query.approved_at.$gte = moment.tz(dto.approve_start_date, 'Asia/Seoul').startOf('day').toDate();
		}
		if (dto.approve_end_date) {
			query.approved_at.$lte = moment.tz(dto.approve_end_date, 'Asia/Seoul').endOf('day').toDate();
		}
	}
}

// is_active true 인 유저 필터링 함수
export async function setActiveQuery(userModel: Model<User>): Promise<User[]> {
	return await userModel.find({ is_active: true }).exec();
}
