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

export function ValidateUserId(userId: string): void {
	const userIdRegex = /^[a-zA-Z0-9_]{6,12}$/;
	if (!userIdRegex.test(userId)) {
		throw new BadRequestException(ERROR_MESSAGE_USERID_POLICY);
	}
}
