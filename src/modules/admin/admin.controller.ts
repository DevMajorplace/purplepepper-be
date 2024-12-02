import { Body, Controller, Get, Patch, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/page-query.dto';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRoles } from '../auth/types/role.decorator';
import { Role } from '../auth/types/role.enum';
import { CashLogStatus } from '../client/types/cash-log.enum';
import { AdminService } from './admin.service';
import { AgencyDetailReqDto } from './dto/req/agency.detail.req.dto';
import { AgencyListReqDto } from './dto/req/agency.list.req.dto';
import { BusinessRegistrationReqDto } from './dto/req/business.registration.req.dto';
import { CashRequestListReqDto } from './dto/req/cash.request.list.req.dto';
import { ClientDetailReqDto } from './dto/req/client.detail.req.dto';
import { ClientListReqDto } from './dto/req/client.list.req.dto';
import { TargetSalesReqDto } from './dto/req/target.sales.req.dto';
import { UsersStatusApproveReqDto } from './dto/req/user.status.approve.req.dto';
import { UsersStatusDeclineReqDto } from './dto/req/user.status.decline.req.dto';
import { UserStatusQueryDto } from './dto/req/user.status.req.dto';
import { AgencyDetailResDto } from './dto/res/agency.detail.res.dto';
import { AgencyListResDto } from './dto/res/agency.list.res.dto';
import { AgencySalesStatResDto } from './dto/res/agency.sales.stat.res.dto';
import { BusinessRegistrationResDto } from './dto/res/business.registration.res.dto';
import { CashRequestListResDto } from './dto/res/cash.request.list.res.dto';
import { ClientDetailResDto } from './dto/res/client.detail.res.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';
import { TargetSalesResDto } from './dto/res/target.sales.res.dto';
import { UsersUpdateResultResDto } from './dto/res/user.update.result.res.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
@UserRoles(Role.Admin)
@Controller('admin')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	// 가입 대기/거절 회원 조회
	@Get('status')
	@ApiExtraModels(UserStatusResDto)
	@ApiResponse({
		schema: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: { $ref: getSchemaPath(UserStatusResDto) },
				},
				totalItems: { type: 'number' },
				totalPages: { type: 'number' },
				currentPage: { type: 'number' },
				pageSize: { type: 'number' },
			},
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async getUsersByStatus(@Query() query: UserStatusQueryDto): Promise<{
		data: UserStatusResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.adminService.getUsersByStatus(query.status, query.page, query.pageSize);
	}

	// 사업자 등록증 조회
	@Get('business-registration')
	@ApiResponse({ type: BusinessRegistrationResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async getBusinessRegistration(
		@Query() businessRegistrationReqDto: BusinessRegistrationReqDto,
	): Promise<BusinessRegistrationResDto> {
		return this.adminService.getBusinessRegistration(businessRegistrationReqDto);
	}

	// 가입 승인(단일, 다중 사용자)
	@Patch('approve')
	@ApiResponse({ type: UsersUpdateResultResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async approveUsers(@Body() usersUpdateReqDto: UsersStatusApproveReqDto): Promise<UsersUpdateResultResDto> {
		return this.adminService.updateUserStatus(usersUpdateReqDto, 'approved');
	}

	// 가입 거절(단일, 다중 사용자)
	@Patch('decline')
	@ApiResponse({ type: UsersUpdateResultResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async declineUsers(@Body() usersUpdateReqDto: UsersStatusDeclineReqDto): Promise<UsersUpdateResultResDto> {
		return this.adminService.updateUserStatus(usersUpdateReqDto, 'declined');
	}

	// 가입된 광고주 목록 조회
	@Get('clients')
	@ApiExtraModels(ClientListResDto)
	@ApiResponse({
		schema: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: { $ref: getSchemaPath(ClientListResDto) },
				},
				totalItems: { type: 'number' },
				totalPages: { type: 'number' },
				currentPage: { type: 'number' },
				pageSize: { type: 'number' },
			},
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async getAllClients(@Query() clientListReqDto: ClientListReqDto): Promise<{
		data: ClientListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.adminService.getAllClients(clientListReqDto.page, clientListReqDto.pageSize, clientListReqDto);
	}

	// 단일 광고주 상세 조회
	@Get('client')
	@ApiResponse({ type: ClientDetailResDto })
	async getClientDetail(@Query('userId') userId: string): Promise<ClientDetailResDto> {
		return this.adminService.getClientDetail(userId);
	}

	// 단일 광고주 상세 정보 변경
	@Patch('client')
	@ApiResponse({ type: ClientDetailResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async updateClientDetail(
		@Query('userId') userId: string,
		@Body() clientDetailReqDto: ClientDetailReqDto,
	): Promise<ClientDetailResDto> {
		return this.adminService.updateClientDetail(userId, clientDetailReqDto);
	}

	// 가입된 총판 목록 조회
	@Get('agencies')
	@ApiExtraModels(AgencyListResDto)
	@ApiResponse({
		schema: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: { $ref: getSchemaPath(AgencyListResDto) },
				},
				totalItems: { type: 'number' },
				totalPages: { type: 'number' },
				currentPage: { type: 'number' },
				pageSize: { type: 'number' },
			},
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async getAllAgencies(@Query() agencyListReqDto: AgencyListReqDto): Promise<{
		data: AgencyListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.adminService.getAllAgencies(agencyListReqDto.page, agencyListReqDto.pageSize, agencyListReqDto);
	}

	// 단일 총판 상세 조회
	@Get('agency')
	@ApiResponse({ type: AgencyDetailResDto })
	async getAgencyDetail(@Query('userId') userId: string): Promise<AgencyDetailResDto> {
		return this.adminService.getAgencyDetail(userId);
	}

	// 단일 총판 상세 정보 변경
	@Patch('agency')
	@ApiResponse({ type: AgencyDetailResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async updateAgencyDetail(
		@Query('userId') userId: string,
		@Body() agencyDetailReqDto: AgencyDetailReqDto,
	): Promise<AgencyDetailResDto> {
		return this.adminService.updateAgencyDetail(userId, agencyDetailReqDto);
	}

	// 광고주 캐시 충전 요청 확인
	@Get('charge-request')
	@ApiExtraModels(CashRequestListResDto)
	@ApiResponse({
		schema: {
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: { $ref: getSchemaPath(CashRequestListResDto) },
				},
				totalItems: { type: 'number' },
				totalPages: { type: 'number' },
				currentPage: { type: 'number' },
				pageSize: { type: 'number' },
			},
		},
	})
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async getChargeRequest(@Query() paginationQueryDto: PaginationQueryDto): Promise<{
		success: CashRequestListResDto[];
		failed: { cashLogIdx: string; reason: string }[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.adminService.getChargeRequest(paginationQueryDto.page, paginationQueryDto.pageSize);
	}

	// 광고주 캐시 충전 요청 승인
	@Patch('charge-request/approve')
	@ApiResponse({ type: CashRequestListResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async approveChargeRequest(
		@Body() body: CashRequestListReqDto,
	): Promise<{ success: CashRequestListResDto[]; failed: { cashLogIdx: string; reason: string }[] }> {
		return this.adminService.updateChargeRequest({ ...body, status: CashLogStatus.APPROVED });
	}

	// 광고주 캐시 충전 요청 거절
	@Patch('charge-request/decline')
	@ApiResponse({ type: CashRequestListResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async declineChargeRequest(
		@Body() body: CashRequestListReqDto,
	): Promise<{ success: CashRequestListResDto[]; failed: { cashLogIdx: string; reason: string }[] }> {
		return this.adminService.updateChargeRequest({ ...body, status: CashLogStatus.REJECTED });
	}

	// 목표 매출 설정
	@Patch('target-sales')
	@ApiResponse({ type: TargetSalesResDto })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async updateTargetSalesForAdmin(
		@Body() targetSalesReqDto: TargetSalesReqDto,
	): Promise<{ success: TargetSalesResDto[]; failed: { user_id: string; reason: string }[] }> {
		return this.adminService.updateTargetSales(targetSalesReqDto);
	}

	// 목표 매출 조회
	@Get('target-sales')
	@ApiResponse({ type: AgencySalesStatResDto, isArray: true })
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async getTargetSalesForAgencies(): Promise<AgencySalesStatResDto[]> {
		return this.adminService.getAgencyMonthlyTargetSales();
	}
}
