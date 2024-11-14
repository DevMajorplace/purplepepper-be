import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';
import { Model } from 'mongoose';
import { paginate, PaginationResult } from 'src/common/utils/pagination.util';
import { isNotEmptyUserId, validatePassword } from 'src/common/utils/validation.util';
import {
	ERROR_MESSAGE_NO_USER_IDS,
	ERROR_MESSAGE_USER_NOT_FOUND,
	ERROR_MESSAGE_USERS_NOT_FOUND,
} from '../../common/constants/error-messages';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from '../admin/dto/res/user.status.update.res.dto';
import { AuthService } from '../auth/auth.service';
import { LoginLog } from '../users/schemas/login-log.schema';
import { User } from '../users/schemas/user.schema';
import { AgencyListReqDto } from './dto/req/agency.list.req.dto';
import { ClientDetailReqDto } from './dto/req/client.detail.req.dto';
import { ClientListReqDto } from './dto/req/client.list.req.dto';
import { AgencyListResDto } from './dto/res/agency.list.res.dto';
import { ClientDetailResDto } from './dto/res/client.detail.res.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(LoginLog.name) private readonly loginLogModel: Model<LoginLog>,
		private readonly authService: AuthService,
	) {}

	// 기본 조건 + 업체명 검색 함수
	private setBaseQuery(role: string, dto: any) {
		const query: any = {
			status: 'approved',
			role: role,
		};

		// 업체명 부분 검색 필터링 조건 설정
		if (dto?.company_name) {
			query.company_name = { $regex: dto.company_name, $options: 'i' }; // 대소문자 구분 없이 부분 일치 검색
		}

		return query;
	}

	// 가입 승인일 필터링 함수
	private setApprovedDateQuery(dto: any, query: any) {
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
		const query = this.setBaseQuery('client', clientListReqDto);

		// 가입승인일 필터링
		this.setApprovedDateQuery(clientListReqDto, query);

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
				// 로그인 기록이 조건에 맞지 않으면 null 반환
				if (!lastLogin) {
					return null;
				}

				return new ClientListResDto(
					{
						user_id: user.user_id,
						company_name: user.company_name,
						cash: user.cash,
						point: user.point,
						manager_name: user.manager_name,
						manager_contact: user.manager_contact,
						parent_id: user.parent_ids,
						approved_at: user.approved_at,
					},
					lastLogin.login_timestamp,
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

	// 광고주 아이디 조회 함수
	private async findClientById(userId: string) {
		// 아이디 공백 검사
		isNotEmptyUserId(userId);

		const query: any = {
			user_id: userId,
			status: 'approved',
			role: 'client',
		};

		const user = await this.userModel.findOne(query).exec();
		if (!user) {
			throw new NotFoundException(ERROR_MESSAGE_USER_NOT_FOUND);
		}
		return user;
	}

	// 단일 광고주 상세 조회
	async getClientDetail(userId: string): Promise<ClientDetailResDto> {
		const user = await this.findClientById(userId);

		return new ClientDetailResDto({
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
		});
	}

	// 단일 광고주 정보 변경
	async updateClientDetail(userId: string, clientDetailReqDto: ClientDetailReqDto): Promise<ClientDetailResDto> {
		// 아이디 공백 검사
		isNotEmptyUserId(userId);

		const user = await this.findClientById(userId);

		// 비밀번호 변경 시 비밀번호 정책 검사
		if (clientDetailReqDto.password) {
			validatePassword(clientDetailReqDto.password);
		}

		const updateFields: any = {};

		// null이나 undefined가 아니면 변경으로 인식
		Object.entries(clientDetailReqDto).forEach(([key, value]) => {
			if (value !== undefined && value !== user[key]) {
				updateFields[key] = value;
			}
		});

		if (Object.keys(updateFields).length === 0) {
			// 변경 사항이 없으므로, 현재 사용자 정보 그대로 반환
			return new ClientDetailResDto(user);
		}

		// 변경된 정보 업데이트 수행
		await this.userModel.updateOne({ _id: user._id }, { $set: updateFields }).exec();

		// 업데이트된 사용자 정보 반환
		const updatedUser = await this.findClientById(userId);
		return new ClientDetailResDto(updatedUser);
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
		const query = this.setBaseQuery('agency', agencyListReqDto);

		// 가입승인일 필터링
		this.setApprovedDateQuery(agencyListReqDto, query);

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
}
