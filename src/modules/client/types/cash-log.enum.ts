export enum CashLogType {
	DEPOSIT = '충전', // 사용자가 현금을 충전한 경우
	REFUND = '환불', // 사용자가 환급받은 경우
	USAGE = '사용', // 미션 등록 등 현금을 사용한 경우
	ADJUSTMENT = '조정', // 관리자에 의해 수동 조정된 경우
}

export enum CashLogCategory {
	REFUND = '환급',
	MISSION_REGISTRATION = '미션 등록',
	DEPOSIT_PENDING = '입금 대기',
	DEPOSIT_CONFIRMED = '입금 확인',
	DEPOSIT_OVERDUE = '입금 기한 초과',
	CANCEL = '취소',
}

export enum CashLogStatus {
	PENDING = '대기',
	APPROVED = '승인',
	REJECTED = '거절',
	ERROR = '오류',
	USED = '사용',
	REFUNDED = '환급',
}
