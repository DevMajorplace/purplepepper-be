import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment-timezone';
import { Model } from 'mongoose';
import { setActiveQuery, setApprovedDateQuery, setBaseQuery } from 'src/common/utils/filter.util';
import { paginate, PaginationResult } from 'src/common/utils/pagination.util';
import { isNotEmptyUserId, validatePassword, validHierarchy } from 'src/common/utils/validation.util';
import { MonthlySales } from 'src/db/schema/monthly-sales.schema';
import {
	ERROR_MESSAGE_ALREADY_IN_STATUS,
	ERROR_MESSAGE_CASH_LOG_ID_MISSING,
	ERROR_MESSAGE_CASH_LOGS_NOT_FOUND,
	ERROR_MESSAGE_FAILED_UPDATE,
	ERROR_MESSAGE_INVALID_ROLE,
	ERROR_MESSAGE_INVALID_STATUS_LOGS,
	ERROR_MESSAGE_INVALID_TARGET_SALES,
	ERROR_MESSAGE_INVALID_USER,
	ERROR_MESSAGE_NO_REJECTION_REASON,
	ERROR_MESSAGE_NO_USER_IDS,
	ERROR_MESSAGE_PARENT_NOT_FOUND,
	ERROR_MESSAGE_USER_NOT_FOUND,
} from '../../common/constants/error-messages';
import { CashLog } from '../../db/schema/cash-log.schema';
import { LoginLog } from '../../db/schema/login-log.schema';
import { User } from '../../db/schema/user.schema';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from '../admin/dto/res/user.status.update.res.dto';
import { CashLogCategory, CashLogStatus } from '../client/types/cash-log.enum';
import { AgencyDetailReqDto } from './dto/req/agency.detail.req.dto';
import { AgencyListReqDto } from './dto/req/agency.list.req.dto';
import { CashRequestListReqDto } from './dto/req/cash.request.list.req.dto';
import { ClientDetailReqDto } from './dto/req/client.detail.req.dto';
import { ClientListReqDto } from './dto/req/client.list.req.dto';
import { TargetSalesReqDto } from './dto/req/target.sales.req.dto';
import { AgencyDetailResDto } from './dto/res/agency.detail.res.dto';
import { AgencyListResDto } from './dto/res/agency.list.res.dto';
import { AgencySalesStatResDto } from './dto/res/agency.sales.stat.dto';
import { CashRequestListResDto } from './dto/res/cash.request.list.res.dto';
import { ClientDetailResDto } from './dto/res/client.detail.res.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';
import { FailedUserDto } from './dto/res/failed.user.res.dto';
import { TargetSalesResDto } from './dto/res/target.sales.res.dto';
import { UsersUpdateResultResDto } from './dto/res/user.update.result.res.dto';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(LoginLog.name) private readonly loginLogModel: Model<LoginLog>,
		@InjectModel(CashLog.name) private readonly cashLogModel: Model<CashLog>,
		@InjectModel(MonthlySales.name) private readonly MonthlySalesModel: Model<MonthlySales>,
	) {}

	// 공통 아이디 조회 함수
	private async findUserById(userId: string, role: 'agency' | 'client') {
		// 아이디 공백 검사
		isNotEmptyUserId(userId);

		const query: any = {
			user_id: userId,
			status: 'approved',
			role: role,
			is_active: true, //setActive 대신 이쪽에서 활용
		};

		const user = await this.userModel.findOne(query).exec();
		if (!user) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}
		return user;
	}

	// 단일 상세 조회 함수
	async getDetail(userId: string, role: 'agency' | 'client'): Promise<AgencyDetailResDto | ClientDetailResDto> {
		const user = await this.findUserById(userId, role);

		if (!user) {
			throw new BadRequestException(ERROR_MESSAGE_INVALID_USER);
		}

		const detailData = {
			company_name: user.company_name,
			parent_id: user.parent_ids,
			is_active: user.is_active,
			user_id: user.user_id,
			manager_name: user.manager_name,
			manager_contact: user.manager_contact,
			account_bank: user.account_bank,
			account_number: user.account_number,
			account_holder: user.account_holder,
			memo: user.memo,
		};

		// 역할에 따라 맞는 ResDto 인스턴스를 반환
		if (role === 'agency') {
			return new AgencyDetailResDto(detailData);
		} else {
			return new ClientDetailResDto(detailData);
		}
	}

	// 단일 계정 정보 업데이트 함수
	async updateUserDetail<T extends AgencyDetailReqDto | ClientDetailReqDto, R>(
		userId: string,
		detailReqDto: T,
		detailResDto: new (user: any) => R,
		role: 'client' | 'agency',
	): Promise<R> {
		// 아이디 공백 검사
		isNotEmptyUserId(userId);

		// 활성 사용자와 역할 확인
		const user = await this.userModel.findOne({ user_id: userId, is_active: true }).exec();

		if (!user) {
			throw new BadRequestException(ERROR_MESSAGE_INVALID_USER);
		}

		if (user.role !== role) {
			throw new BadRequestException(ERROR_MESSAGE_INVALID_ROLE);
		}

		const updateFields: any = {};

		// 비밀번호 변경 로직 (기존 값과 비교)
		if (detailReqDto.password) {
			validatePassword(detailReqDto.password); // 비밀번호 정책 검사
			if (!user.password || !user.password.startsWith('$2b$')) {
				updateFields.password = await bcrypt.hash(detailReqDto.password, 10);
			} else {
				const isSamePassword = await bcrypt.compare(detailReqDto.password, user.password);
				if (!isSamePassword) {
					updateFields.password = await bcrypt.hash(detailReqDto.password, 10); // 비밀번호 해싱
				}
			}
		}

		// parent_id를 기준으로 parent_ids 갱신
		if (role === 'client') {
			const clientReqDto = detailReqDto as ClientDetailReqDto;

			if (clientReqDto.parent_id) {
				// 새로운 parent_ids 계산
				const parentHierarchy = await validHierarchy(clientReqDto.parent_id, this.userModel);

				if (!parentHierarchy) {
					throw new NotFoundException(ERROR_MESSAGE_PARENT_NOT_FOUND);
				}

				const newParentIds = [clientReqDto.parent_id, ...parentHierarchy];

				// 최대 3단계까지만 저장
				updateFields.parent_ids = newParentIds.slice(0, 3); // 최대 3단계
			}
		}

		// 나머지 필드 업데이트 로직
		Object.entries(detailReqDto).forEach(([key, value]) => {
			if (
				value !== undefined && // 값이 정의되어 있고
				value !== null && // null이 아니며
				key !== 'password' && // 비밀번호는 별도로 처리했으므로 제외
				key !== 'parent_id' // parent_id는 별도로 처리했으므로 제외
			) {
				updateFields[key] = value;
			}
		});

		// 변경 사항 없으면 기존 데이터 반환
		if (Object.keys(updateFields).length === 0) {
			return new detailResDto(user);
		}

		// 변경된 정보 업데이트 및 반환
		const updatedUser = await this.userModel
			.findOneAndUpdate(
				{ user_id: user.user_id },
				{ $set: updateFields },
				{ new: true }, // 업데이트된 문서를 반환
			)
			.exec();

		return new detailResDto(updatedUser);
	}

	// 가입 대기/거절 회원 조회
	async findUsersByStatus(
		status: 'pending' | 'declined',
		page: number = 1,
		pageSize: number = 15,
	): Promise<PaginationResult<UserStatusResDto>> {
		// 검색 조건 설정
		const query = { status };

		// 활성 사용자 확인
		const activeUsers = await setActiveQuery(this.userModel);
		const activeUserIds = activeUsers.map(user => user._id.toString());

		// 페이지네이션 호출
		const result = await paginate(this.userModel, page, pageSize, {
			...query,
			_id: { $in: activeUserIds }, // 활성 회원만 필터링
		});

		// 결과 데이터 형식을 UserStatusResDto로 변환
		return {
			...result,
			data: result.data.map(user => new UserStatusResDto(user)),
		};
	}

	// 가입 상태 업데이트(단일, 다중 사용자 승인 거절)
	async updateUserStatus(userIds: string[], status: 'approved' | 'declined'): Promise<UsersUpdateResultResDto> {
		// 입력된 userIds가 단일 문자열일 경우 배열로 변환
		const idsArray = typeof userIds === 'string' ? [userIds] : userIds;

		if (idsArray.length === 0) {
			throw new BadRequestException(ERROR_MESSAGE_NO_USER_IDS);
		}
		const failed: FailedUserDto[] = []; // 실패한 사용자 목록 저장
		let updatedUsers: UserStatusUpdateResDto[] = []; // 성공적으로 업데이트된 사용자 목록

		try {
			// 활성 사용자 확인
			const activeUsers = await setActiveQuery(this.userModel);
			const activeUserIds = activeUsers.map(user => user.user_id);

			// 입력된 ID 중 활성 사용자만 필터링
			const validIds = idsArray.filter(id => activeUserIds.includes(id));
			const invalidIds = idsArray.filter(id => !activeUserIds.includes(id));

			// 비활성 사용자 ID를 실패 목록에 추가
			invalidIds.forEach(id => {
				failed.push(new FailedUserDto(id, ERROR_MESSAGE_INVALID_USER));
			});

			const users = await this.userModel.find({ user_id: { $in: validIds } }).exec();
			const foundUserIds = users.map(user => user.user_id);
			const missingUserIds = validIds.filter(id => !foundUserIds.includes(id));

			missingUserIds.forEach(id => {
				failed.push(new FailedUserDto(id, ERROR_MESSAGE_USER_NOT_FOUND));
			});

			const usersToUpdate = users.filter(user => user.status !== status); // 상태 다른 업데이트 될 사용자
			const alreadyUpdatedUsers = users.filter(user => user.status === status); // 상태 같은 이미 업데이트 된 사용자

			//이미 동일한 상태인 사용자 실패 목록에 추가
			alreadyUpdatedUsers.forEach(user => {
				failed.push(new FailedUserDto(user.user_id, ERROR_MESSAGE_ALREADY_IN_STATUS(status)));
			});

			const updateFields = {
				status,
				approved_at: status === 'approved' ? new Date() : null,
				declined_at: status === 'declined' ? new Date() : null,
			};
			if (usersToUpdate.length > 0) {
				const userIdsToUpdate = usersToUpdate.map(user => user.user_id);
				await this.userModel.updateMany({ user_id: { $in: userIdsToUpdate } }, updateFields).exec();
			}

			updatedUsers = await this.userModel
				.find({ user_id: { $in: usersToUpdate.map(user => user.user_id) } })
				.exec()
				.then(
					users => users.map(user => new UserStatusUpdateResDto(user)), // DTO로 변환
				);
		} catch (error) {
			throw new InternalServerErrorException(ERROR_MESSAGE_FAILED_UPDATE);
		}
		return new UsersUpdateResultResDto(updatedUsers, failed);
	}

	// 가입된 광고주 조건/전체 조회
	async getAllClients(
		page: number = 1,
		pageSize: number = 15,
		clientListReqDto?: ClientListReqDto,
	): Promise<{
		data: ClientListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		// 기본 검색 조건 + 업체명 검색
		const query = setBaseQuery('client', clientListReqDto);

		// 활성 사용자 확인
		const activeUsers = await setActiveQuery(this.userModel);
		const activeUserIds = activeUsers.map(user => user._id.toString());
		query._id = { $in: activeUserIds }; // 활성 사용자만 필터링

		// 가입승인일 필터링
		setApprovedDateQuery(clientListReqDto, query);

		// 페이지네이션 호출
		const result = await paginate(this.userModel, page, pageSize, query);

		// 최종 클라이언트 리스트 생성 (마지막 로그인 날짜 조건 추가 필터링)
		const clientList = await Promise.all(
			result.data.map(async user => {
				// 마지막 로그인 기록 조회 (로그인 성공만) + 필터링 조건 설정
				const lastLoginQuery: any = { user_idx: user._id, login_success: true };

				if (clientListReqDto?.last_login_start_date || clientListReqDto?.last_login_end_date) {
					lastLoginQuery.login_timestamp = {};
					if (clientListReqDto.last_login_start_date) {
						// 마지막 로그인 시작일을 한국 시간 기준으로 UTC 변환
						lastLoginQuery.login_timestamp.$gte = moment
							.tz(clientListReqDto.last_login_start_date, 'Asia/Seoul')
							.startOf('day')
							.toDate();
					}
					if (clientListReqDto.last_login_end_date) {
						// 마지막 로그인 종료일을 한국 시간 기준으로 UTC 변환
						lastLoginQuery.login_timestamp.$lte = moment
							.tz(clientListReqDto.last_login_end_date, 'Asia/Seoul')
							.endOf('day')
							.toDate();
					}
				}

				const lastLogin = await this.loginLogModel.findOne(lastLoginQuery).sort({ login_timestamp: -1 }).exec();

				// 마지막 로그인 기록이 없으면 계정 생성일로 설정
				const lastLoginTimestamp = lastLogin ? lastLogin.login_timestamp : user.created_at;

				// 상위 회원 추출
				const parentId = user.parent_ids?.[0] ?? null;

				return new ClientListResDto(
					{
						user_id: user.user_id,
						company_name: user.company_name,
						cash: user.cash,
						point: user.point,
						manager_name: user.manager_name,
						manager_contact: user.manager_contact,
						parent_id: parentId,
						approved_at: user.approved_at,
					},
					lastLoginTimestamp,
				);
			}),
		);

		// null 값을 제거하고 결과 반환
		return {
			data: clientList.filter(client => client !== null),
			totalItems: result.totalItems,
			totalPages: result.totalPages,
			currentPage: page,
			pageSize,
		};
	}

	// 단일 광고주 상세 조회
	async getClientDetail(userId: string): Promise<ClientDetailResDto> {
		return this.getDetail(userId, 'client') as Promise<ClientDetailResDto>;
	}

	// 단일 광고주 정보 변경
	async updateClientDetail(userId: string, clientDetailReqDto: ClientDetailReqDto): Promise<ClientDetailResDto> {
		return this.updateUserDetail(userId, clientDetailReqDto, ClientDetailResDto, 'client');
	}

	// 가입된 총판 조건/전체 조회
	async getAllAgencies(
		page: number = 1,
		pageSize: number = 15,
		agencyListReqDto?: AgencyListReqDto,
	): Promise<{
		data: AgencyListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		// 기본 검색 조건 + 업체명 검색
		const query = setBaseQuery('agency', agencyListReqDto);

		// 가입승인일 필터링
		setApprovedDateQuery(agencyListReqDto, query);

		// 활성 사용자 확인
		const activeUsers = await setActiveQuery(this.userModel);
		const activeUserIds = activeUsers.map(user => user._id.toString());
		query._id = { $in: activeUserIds };

		// 페이지네이션 호출
		const result = await paginate(this.userModel, page, pageSize, query);

		// 필터된 각 총판에 대해 하위 회원 수 및 전일 대비 회원 증가 수 계산
		const agenciesData = await Promise.all(
			result.data.map(async agency => {
				const { user_id, company_name, point, manager_name, manager_contact, approved_at } = agency;

				// 하위 회원 수 계산
				const numberOfUsers = await this.userModel.countDocuments({ parent_ids: user_id });

				// 전일과 당일의 회원 증가 수 계산 (KST 기준)
				const yesterdayStart = moment.tz('Asia/Seoul').subtract(1, 'days').startOf('day').toDate();
				const yesterdayEnd = moment.tz('Asia/Seoul').subtract(1, 'days').endOf('day').toDate();
				const todayStart = moment.tz('Asia/Seoul').startOf('day').toDate();
				const todayEnd = moment.tz('Asia/Seoul').endOf('day').toDate();

				// 전일 가입 회원 수 계산
				const yesterdayMemberCount = await this.userModel.countDocuments({
					parent_ids: user_id,
					approved_at: { $gte: yesterdayStart, $lte: yesterdayEnd },
				});

				// 당일 가입 회원 수 계산
				const todayMemberCount = await this.userModel.countDocuments({
					parent_ids: user_id,
					approved_at: { $gte: todayStart, $lte: todayEnd },
				});

				// 전일 대비 회원 증가 수 계산
				const dailyMemberGrowth = todayMemberCount - yesterdayMemberCount;

				return new AgencyListResDto({
					user_id,
					company_name,
					numberOfUsers,
					dailyMemberGrowth,
					point,
					manager_name,
					manager_contact,
					approved_at,
				});
			}),
		);

		return {
			data: agenciesData,
			totalItems: result.totalItems,
			totalPages: result.totalPages,
			currentPage: page,
			pageSize: pageSize,
		};
	}

	// 단일 총판 상세 조회
	async getAgencyDetail(userId: string): Promise<AgencyDetailResDto> {
		return this.getDetail(userId, 'agency') as Promise<AgencyDetailResDto>;
	}

	// 단일 총판 정보 변경
	async updateAgencyDetail(userId: string, agencyDetailReqDto: AgencyDetailReqDto): Promise<AgencyDetailResDto> {
		return this.updateUserDetail(userId, agencyDetailReqDto, AgencyDetailResDto, 'agency');
	}

	// 광고주 캐시 충전 요청 확인
	async getChargeRequest(
		page: number,
		pageSize: number,
	): Promise<{
		success: CashRequestListResDto[];
		failed: { cashLogIdx: string; reason: string }[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		// 결과를 저장할 배열
		const success: CashRequestListResDto[] = [];
		const failed: { cashLogIdx: string; reason: string }[] = [];

		// 페이지네이션 호출
		const cashLogs = await paginate(this.cashLogModel, page, pageSize);

		// 활성 사용자 조회
		const activeUsers = await setActiveQuery(this.userModel);
		const activeUserMap = new Map(activeUsers.map(user => [user._id.toString(), user]));

		// 캐시로그 순회하여 성공 및 실패 분류
		cashLogs.data.forEach(cashLog => {
			const user = activeUserMap.get(cashLog.user_idx.toString());

			if (!user) {
				// 활성 사용자가 아닌 경우 실패 처리
				failed.push({
					cashLogIdx: cashLog._id.toString(),
					reason: `${ERROR_MESSAGE_INVALID_USER}: ${cashLog.user_idx}`,
				});
			} else {
				// 활성 사용자일 경우 성공 처리
				success.push(
					new CashRequestListResDto({
						cash_log_idx: cashLog._id.toString(),
						user_idx: cashLog.user_idx,
						company_name: user.company_name,
						depositor: cashLog.depositor,
						amount: cashLog.amount,
						created_at: cashLog.created_at,
						status: cashLog.status,
						processed_at:
							cashLog.status === CashLogStatus.APPROVED
								? cashLog.approved_at
								: [CashLogStatus.REJECTED, CashLogStatus.ERROR].includes(cashLog.status)
									? cashLog.declined_at
									: null, // 처리 시점 설정
						rejection_reason: cashLog.rejection_reason || '', // 기본값 빈 문자열
					}),
				);
			}
		});

		return {
			success,
			failed,
			totalItems: cashLogs.totalItems,
			totalPages: cashLogs.totalPages,
			currentPage: cashLogs.currentPage,
			pageSize: cashLogs.pageSize,
		};
	}

	// 광고주 캐시 충전 요청 승인/거절
	async updateChargeRequest(
		cashRequestListReqDto: CashRequestListReqDto & { status: CashLogStatus; rejection_reason?: string },
	): Promise<{ success: CashRequestListResDto[]; failed: { cashLogIdx: string; reason: string }[] }> {
		const { cashLogIdx, status, rejection_reason } = cashRequestListReqDto;

		// 요청된 ID가 없으면 예외 처리
		if (!cashLogIdx || cashLogIdx.length === 0) {
			throw new BadRequestException(ERROR_MESSAGE_CASH_LOG_ID_MISSING);
		}

		// 결과를 저장할 배열
		const success: CashRequestListResDto[] = [];
		const failed: { cashLogIdx: string; reason: string }[] = [];

		try {
			// 존재하는 캐시 로그 조회
			const cashLogs = await this.cashLogModel.find({ _id: { $in: cashLogIdx } }).exec();
			const foundIds = cashLogs.map(cashLog => cashLog._id.toString());
			const missingCashLogIds = cashLogIdx.filter(id => !foundIds.includes(id));

			// 누락된 ID 실패 처리
			missingCashLogIds.forEach(id => {
				failed.push({ cashLogIdx: id, reason: ERROR_MESSAGE_CASH_LOGS_NOT_FOUND(id) });
			});

			// 활성 사용자 조회
			const activeUsers = await setActiveQuery(this.userModel);
			const activeUserMap = new Map(activeUsers.map(user => [user._id.toString(), user]));

			// 활성 사용자만 필터링
			const logsWithInactiveUsers = cashLogs.filter(cashLog => !activeUserMap.has(cashLog.user_idx.toString()));
			logsWithInactiveUsers.forEach(log => {
				failed.push({
					cashLogIdx: log._id.toString(),
					reason: `${ERROR_MESSAGE_INVALID_USER}: ${log.user_idx}`,
				});
			});

			// 대기 상태가 아닌 로그 실패 처리
			const invalidLogs = cashLogs.filter(cashLog => cashLog.status !== CashLogStatus.PENDING);
			invalidLogs.forEach(log => {
				failed.push({
					cashLogIdx: log._id.toString(),
					reason: ERROR_MESSAGE_INVALID_STATUS_LOGS(log.status),
				});
			});

			// 승인/거절에 따라 업데이트 필드 분기 처리
			const updateFields: any = {};

			if (status === CashLogStatus.APPROVED) {
				updateFields.status = CashLogStatus.APPROVED;
				updateFields.category = CashLogCategory.DEPOSIT_CONFIRMED;
				updateFields.approved_at = new Date(); // 승인 날짜 설정
			} else if (status === CashLogStatus.REJECTED) {
				if (!rejection_reason) {
					throw new BadRequestException(ERROR_MESSAGE_NO_REJECTION_REASON);
				}
				updateFields.status = CashLogStatus.REJECTED;
				updateFields.category = CashLogCategory.CANCEL;
				updateFields.declined_at = new Date(); // 거절 날짜 설정
				updateFields.rejection_reason = rejection_reason; // 거절 사유 설정
			}

			// 업데이트할 로그 필터링
			const logsToUpdate = cashLogs.filter(
				cashLog =>
					cashLog.status === CashLogStatus.PENDING && // 대기 상태일 때만 승인/거절 가능
					cashLog.status !== status && // 이미 요청된 상태와 동일하지 않은 경우만
					activeUserMap.has(cashLog.user_idx.toString()), // 활성 사용자만 처리
			);

			if (logsToUpdate.length > 0) {
				const logIdsToUpdate = logsToUpdate.map(cashLog => cashLog._id.toString());
				await this.cashLogModel.updateMany({ _id: { $in: logIdsToUpdate } }, updateFields).exec();
			}

			// 승인이면 충전 요청 금액만큼 유저 cash 추가
			if (status === CashLogStatus.APPROVED) {
				await Promise.all(
					logsToUpdate.map(async cashLog => {
						try {
							const user = activeUserMap.get(cashLog.user_idx.toString());
							if (user) {
								user.cash += cashLog.amount;
								await user.save();
							}
						} catch (error) {
							failed.push({
								cashLogIdx: cashLog._id.toString(),
								reason: ERROR_MESSAGE_FAILED_UPDATE(error.message),
							});
						}
					}),
				);
			}

			// 업데이트 후 최신 상태 조회
			const updatedCashLogs = await this.cashLogModel
				.find({ _id: { $in: logsToUpdate.map(log => log._id.toString()) } })
				.exec();

			// 성공한 로그 추가
			updatedCashLogs.forEach(cashLog => {
				success.push(new CashRequestListResDto(cashLog));
			});
		} catch (error) {
			throw new InternalServerErrorException(ERROR_MESSAGE_FAILED_UPDATE);
		}
		return {
			success,
			failed,
		};
	}

	// 목표 매출 설정
	async updateTargetSales(
		targetSalesReqDto: TargetSalesReqDto,
	): Promise<{ success: TargetSalesResDto[]; failed: { user_id: string; reason: string }[] }> {
		const { targets } = targetSalesReqDto;

		// 입력된 모든 user_id 추출
		const userIds = targets.map(target => target.user_id);

		// 활성 사용자 확인
		const activeUsers = await setActiveQuery(this.userModel);
		const activeUserIds = activeUsers.map(user => user.user_id);

		// 존재하지 않거나 비활성화된 사용자 ID 추출
		const notFoundOrInactiveIds = userIds.filter(id => !activeUserIds.includes(id));

		// 성공적으로 업데이트된 결과를 저장할 배열
		const results: TargetSalesResDto[] = [];
		const failed: { user_id: string; reason: string }[] = [];

		/// KST 시간 기준으로 현재 월 구하기
		const currentMonth = moment().tz('Asia/Seoul').format('YYYY-MM');

		for (const target of targets) {
			const { user_id, target_sales } = target;

			// 목표 매출 유효성 검사
			if (target_sales < 0) {
				failed.push({
					user_id,
					reason: ERROR_MESSAGE_INVALID_TARGET_SALES,
				});
				continue;
			}

			// 존재하지 않는 ID는 건너뜀
			if (notFoundOrInactiveIds.includes(user_id)) {
				failed.push({
					user_id,
					reason: ERROR_MESSAGE_INVALID_USER,
				});
				continue;
			}

			try {
				// userModel의 monthly_target_sales 필드 업데이트
				const updatedTargetSales = await this.userModel
					.findOneAndUpdate({ user_id: user_id }, { $set: { monthly_target_sales: target_sales } }, { new: true })
					.exec();

				// MonthlySalesModel의 monthly_target_sales 필드 업데이트
				await this.MonthlySalesModel.findOneAndUpdate(
					{ user_id, month: currentMonth },
					{ $set: { target_sales: target_sales } },
					{ upsert: true, new: true },
				).exec();

				// 결과 DTO에 추가
				results.push(
					new TargetSalesResDto({
						user_id: updatedTargetSales.user_id,
						target_sales: updatedTargetSales.monthly_target_sales,
					}),
				);
			} catch (error) {
				// 업데이트 중 에러 발생 시 실패 이유 추가
				failed.push({
					user_id,
					reason: ERROR_MESSAGE_FAILED_UPDATE(error.message),
				});
			}
		}

		// 성공 및 실패 결과 반환
		return {
			success: results,
			failed,
		};
	}

	// 이번 달 총판별 목표 매출 조회
	async getAgencyMonthlyTargetSales(): Promise<AgencySalesStatResDto[]> {
		const monthlySales = await this.MonthlySalesModel.find({}).exec();

		// monthlySales에서 user_id 추출하기
		const userIds = monthlySales.map(sale => sale.user_id);

		// 활성 사용자 확인
		const activeUsers = await setActiveQuery(this.userModel);

		// user_id로 userModel 조회해서 총판 정보들만 추리기
		const agencyUsers = activeUsers.filter(user => userIds.includes(user.user_id) && user.role === 'agency');

		// 총판 ID를 기준으로 MonthlySales 데이터를 필터링
		const agencyInfo = agencyUsers.map(user => ({
			user_id: user.user_id,
			company_name: user.company_name,
		}));

		const agencyMonthlySales = agencyInfo.map(agency => {
			const salesData = monthlySales.find(sale => sale.user_id === agency.user_id);
			const targetSales = salesData ? salesData.target_sales : 0;
			const currentSales = salesData ? salesData.sales_amount : 0;
			const achievementRate = targetSales > 0 ? (currentSales / targetSales) * 100 : 0;

			return new AgencySalesStatResDto({
				company_name: agency.company_name,
				current_sales: currentSales,
				target_sales: targetSales,
				achievement_rate: parseFloat(achievementRate.toFixed(2)), // 소수점 둘째 자리까지 표시
			});
		});

		return agencyMonthlySales;
	}
}
