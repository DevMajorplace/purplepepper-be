// Users
export const ERROR_MESSAGE_DUPLICATE_ID = '이미 존재하는 아이디입니다.';
export const ERROR_MESSAGE_HASH_FAILED = '비밀번호 해싱에 실패했습니다.';
export const ERROR_MESSAGE_USER_LOGIN_FAILED = '이메일 또는 비밀번호가 일치하지 않습니다.';
export const ERROR_MESSAGE_INVALID_ROLE = '유효하지 않은 역할입니다.';
export const ERROR_MESSAGE_USER_NOT_FOUND = '존재하지 않는 사용자입니다.';
export const ERROR_MESSAGE_PARENT_NOT_FOUND = '추천인 아이디가 존재하지 않습니다.';
export const ERROR_MESSAGE_NO_USER_IDS = '사용자가 없습니다.';
export const ERROR_MESSAGE_STATUS_PENDING = '가입 대기 상태입니다. 관리자에게 문의하세요.';
export const ERROR_MESSAGE_STATUS_DECLINED = '가입 거절 상태입니다. 관리자에게 문의하세요.';
export const ERROR_MESSAGE_PASSWORD_POLICY = '비밀번호는 8자 이상, 대문자, 숫자, 특수문자를 포함해야 합니다.';
export const ERROR_MESSAGE_USERID_POLICY = '아이디는 6~12자의 영문, 숫자, 언더바[_]만 가능합니다.';

// Boards
export const ERROR_MESSAGE_BOARD_NOT_FOUND = '해당 게시글을 찾을 수 없습니다.';

// Auth
export const ERROR_MESSAGE_INVALID_TOKEN = '유효한 토큰이 아닙니다.';
export const ERROR_MESSAGE_EXPIRED_TOKEN = '기간이 만료된 토큰입니다.';
export const ERROR_MESSAGE_NO_TOKEN = '토큰이 없습니다.';
export const ERROR_MESSAGE_PERMISSION_DENIED = '접근 권한이 없는 계정입니다.';

// Admin
export const ERROR_MESSAGE_USERS_NOT_FOUND = (ids: string) => `다음 사용자 ID를 찾을 수 없습니다: ${ids}`;
export const ERROR_MESSAGE_USER_ID_MISSING = '사용자 ID를 입력해주세요.';
export const ERROR_MESSAGE_CASH_LOG_ID_MISSING = '캐시 로그 ID가 제공되지 않았습니다.';
export const ERROR_MESSAGE_CASH_LOGS_NOT_FOUND = (ids: string) => `다음 캐시로그 ID를 찾을 수 없습니다: ${ids}`;
export const ERROR_MESSAGE_NO_CASH_LOG_USSER = (ids: string) => `캐시 로그가 없는 유저입니다. ${ids}`;
export const ERROR_MESSAGE_NO_REJECTION_REASON = '거절 사유를 입력해주세요.';
export const ERROR_MESSAGE_INVALID_STATUS_LOGS = (status: string): string =>
	`다음 캐시 로그는 대기 상태가 아니므로 승인/거절을 수행할 수 없습니다: ${status}`;
export const ERROR_MESSAGE_INVALID_TARGET_SALES = '유효하지 않은 금액입니다.';
export const ERROR_MESSAGE_ALREADY_IN_STATUS = (status: string): string => `이미 ${status} 상태입니다.`;

// Client
export const ERROR_MESSAGE_INVALID_AMOUNT = '충전 금액은 5만 캐시부터 1000만 캐시까지 가능합니다.';

// Server Error
export const ERROR_MESSAGE_FAILED_UPDATE = (message: string): string => `${message} 이유로 업데이트 실패했습니다.`;
