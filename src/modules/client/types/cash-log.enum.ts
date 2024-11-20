export enum CashLogType {
	ADD = '충전',
	REFUND = '환급',
	DEDUCT = '사용',
}

export enum CashLogCategory {
	CHARGE = '충전',
	REFUND = '환급',
	MISSION_REGISTRATION = '미션 등록',
}

export enum CashLogStatus {
	PENDING = '대기',
	APPROVED = '승인',
	REJECTED = '거절',
	ERROR = '오류',
}
