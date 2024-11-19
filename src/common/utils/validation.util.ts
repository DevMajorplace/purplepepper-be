import { BadRequestException } from '@nestjs/common';
import {
	ERROR_MESSAGE_PASSWORD_POLICY,
	ERROR_MESSAGE_USER_ID_MISSING,
	ERROR_MESSAGE_USERID_POLICY,
} from '../constants/error-messages';

// 비밀번호 유효성 검사 함수
export function validatePassword(password: string): void {
	// 공백 제거
	password = password.trim();
	const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,20}$/;

	if (!passwordRegex.test(password)) {
		throw new BadRequestException(ERROR_MESSAGE_PASSWORD_POLICY);
	}
}

// 유저아이디 공백 검사 함수
export function isNotEmptyUserId(userId: string): void {
	if (!userId || userId.trim() === '') {
		throw new BadRequestException(ERROR_MESSAGE_USER_ID_MISSING);
	}
}

// 유저아이디 유효성 검사 함수
export function validateUserId(userId: string): void {
	const userIdRegex = /^[a-zA-Z0-9_]{6,12}$/;
	if (!userIdRegex.test(userId)) {
		throw new BadRequestException(ERROR_MESSAGE_USERID_POLICY);
	}
}

// 상위 회원 3단계 유효성 검사 함수
export async function validHierarchy(userId: string, maxDepth: number = 3): Promise<string[]> {
	const hierarchy: string[] = [];
	let currentUserId = userId;

	for (let i = 0; i < maxDepth; i++) {
		// 상위 추천인 user_id를 찾기
		const user = await this.userModel.findOne({ user_id: currentUserId }).exec();

		// 현재 추천인이 존재하지 않거나 비활성화 상태이면 중단
		if (!user || !user.parent_ids || user.parent_ids.length === 0 || !user.is_active) break;

		// 다음 상위 추천인 user_id를 가져옴
		const nextUserId = user.parent_ids[0];

		// 유효한 추천인 user_id 중 is_active가 true인 경우에만 추가
		const nextUser = await this.userModel.findOne({ user_id: nextUserId, is_active: true }).exec();
		if (!nextUser) break; // 다음 상위 추천인이 존재하지 않거나 비활성화 상태이면 중단

		hierarchy.push(nextUserId);
		currentUserId = nextUserId;
	}

	return hierarchy;
}
