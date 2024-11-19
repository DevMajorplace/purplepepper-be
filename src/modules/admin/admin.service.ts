import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment-timezone';
import { Model } from 'mongoose';
import { setApprovedDateQuery, setBaseQuery } from 'src/common/utils/filter.util';
import { paginate, PaginationResult } from 'src/common/utils/pagination.util';
import { isNotEmptyUserId, validatePassword } from 'src/common/utils/validation.util';
import {
	ERROR_MESSAGE_INVALID_ROLE,
	ERROR_MESSAGE_NO_USER_IDS,
	ERROR_MESSAGE_PARENT_NOT_FOUND,
	ERROR_MESSAGE_USER_NOT_FOUND,
	ERROR_MESSAGE_USERS_NOT_FOUND,
} from '../../common/constants/error-messages';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from '../admin/dto/res/user.status.update.res.dto';
import { LoginLog } from '../user/schemas/login-log.schema';
import { User } from '../user/schemas/user.schema';
import { AgencyDetailReqDto } from './dto/req/agency.detail.req.dto';
import { AgencyListReqDto } from './dto/req/agency.list.req.dto';
import { ClientDetailReqDto } from './dto/req/client.detail.req.dto';
import { ClientListReqDto } from './dto/req/client.list.req.dto';
import { AgencyDetailResDto } from './dto/res/agency.detail.res.dto';
import { AgencyListResDto } from './dto/res/agency.list.res.dto';
import { ClientDetailResDto } from './dto/res/client.detail.res.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(LoginLog.name) private readonly loginLogModel: Model<LoginLog>,
	) {}

	// 상위 회원 3단계까지 찾는 함수
	private async findHierarchy(userId: string, maxDepth: number = 3): Promise<string[]> {
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

	// 공통 아이디 조회 함수
	private async findUserById(userId: string, role: 'agency' | 'client') {
		// 아이디 공백 검사
		isNotEmptyUserId(userId);

		const query: any = {
			user_id: userId,
			status: 'approved',
			role: role,
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

		const user = await this.userModel.findOne({ user_id: userId });

		// 역할 확인
		if (user.role !== role) {
			throw new BadRequestException(ERROR_MESSAGE_INVALID_ROLE);
		}

		// 업데이트 대상 유저를 가져오기
		const userToUpdate = await this.userModel.findOne({ user_id: userId });
		if (!userToUpdate) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}

		const updateFields: any = {};
		// 비밀번호 변경 로직 (기존 값과 비교)
		if (detailReqDto.password) {
			validatePassword(detailReqDto.password); // 비밀번호 정책 검사

			const isSamePassword = await bcrypt.compare(detailReqDto.password, user.password);
			if (!isSamePassword) {
				updateFields.password = await bcrypt.hash(detailReqDto.password, 10); // 비밀번호 해싱
			}
		}

		// parent_id를 기준으로 parent_ids 갱신
		console.log(userToUpdate.role);
		if (userToUpdate.role === 'client') {
			const clientReqDto = detailReqDto as ClientDetailReqDto;

			if (clientReqDto.parent_id && clientReqDto.parent_id !== user.parent_ids?.[0]) {
				// 새로운 parent_ids 계산
				const parentHierarchy = await this.findHierarchy(clientReqDto.parent_id);

				if (!parentHierarchy) {
					throw new NotFoundException(ERROR_MESSAGE_PARENT_NOT_FOUND);
				}

				const newParentIds = [clientReqDto.parent_id, ...parentHierarchy];
				console.log('새로운 parent_ids:', newParentIds);

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
		page: number,
		pageSize: number,
	): Promise<PaginationResult<UserStatusResDto>> {
		// 검색 조건 설정
		const query = { status };

		// 페이지네이션 호출
		const result = await paginate(this.userModel, page, pageSize, query);

		// 결과 데이터 형식을 UserStatusResDto로 변환
		return {
			...result,
			data: result.data.map(user => new UserStatusResDto(user)),
		};
	}

	// 가입 상태 업데이트(단일, 다중 사용자 승인 거절)
	async updateUserStatus(
		userIds: string[] | string,
		status: 'approved' | 'declined',
	): Promise<{ updatedUsers: UserStatusUpdateResDto[]; missingUserIds: string[] }> {
		// userIds가 단일 문자열인 경우 배열로 변환
		const idsArray = typeof userIds === 'string' ? [userIds] : userIds;

		// userId가 들어오지 않은 경우 예외 발생
		if (idsArray.length === 0) {
			throw new BadRequestException(ERROR_MESSAGE_NO_USER_IDS);
		}

		// 존재하는 사용자 조회 및 누락된 ID 확인
		const users = await this.userModel.find({ user_id: { $in: idsArray } }).exec();
		const foundUserIds = users.map(user => user.user_id);
		const missingUserIds = idsArray.filter(id => !foundUserIds.includes(id));

		if (missingUserIds.length > 0) {
			throw new NotFoundException(ERROR_MESSAGE_USERS_NOT_FOUND(missingUserIds.join(', ')));
		}

		// 이미 요청한 상태와 동일한 경우 업데이트 생략
		const usersToUpdate = users.filter(user => user.status !== status);
		const updateFields = {
			status,
			approved_at: status === 'approved' ? new Date() : null,
			declined_at: status === 'declined' ? new Date() : null,
		};

		// 업데이트할 사용자가 있는 경우에만 상태 업데이트
		if (usersToUpdate.length > 0) {
			const userIdsToUpdate = usersToUpdate.map(user => user.user_id);
			await this.userModel.updateMany({ user_id: { $in: userIdsToUpdate } }, updateFields).exec();
		}

		// 업데이트 후 최신 사용자 상태 다시 조회
		const updatedUsers = await this.userModel.find({ user_id: { $in: foundUserIds } }).exec();

		return {
			updatedUsers: updatedUsers.map(user => new UserStatusUpdateResDto(user)),
			missingUserIds,
		};
	}

	// 가입된 광고주 조건/전체 조회
	async getAllClients(
		page: number,
		pageSize: number,
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
		page: number,
		pageSize: number,
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
}
