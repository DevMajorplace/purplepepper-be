import { Injectable, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';
import { Model } from 'mongoose';
import { setApprovedDateQuery, setBaseQuery } from 'src/common/utils/filter.util';
import { paginate } from 'src/common/utils/pagination.util';
import { ClientListReqDto } from './dto/req/client.list.req.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';

import { LoginLog } from '../../db/schema/login-log.schema';
import { User } from '../../db/schema/user.schema';

@Injectable()
export class AgencyService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(LoginLog.name) private readonly loginLogModel: Model<LoginLog>,
	) {}

	// 가입된 광고주 조건/전체 조회
	async getAllClients(
		page: number,
		pageSize: number,
		clientListReqDto?: ClientListReqDto,
		@Req() req?: any,
	): Promise<{
		data: ClientListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		// 기본 검색 조건 + 업체명 검색
		const user = req.user;
		const agencyId = user.userId;
		const query = setBaseQuery('client', clientListReqDto, agencyId);

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
}
