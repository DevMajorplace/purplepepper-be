import { Body, Controller, Get, Patch, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { UserStatusQueryDto } from '../admin/dto/user-status-query.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRoles } from '../auth/types/role.decorator';
import { Role } from '../auth/types/role.enum';
import { CashLogStatus } from '../client/types/cash-log.enum';
import { AdminService } from './admin.service';
import { AgencyDetailReqDto } from './dto/req/agency.detail.req.dto';
import { AgencyListReqDto } from './dto/req/agency.list.req.dto';
import { CashRequestListReqDto } from './dto/req/cash.request.list.req.dto';
import { ClientDetailReqDto } from './dto/req/client.detail.req.dto';
import { ClientListReqDto } from './dto/req/client.list.req.dto';
import { TargetSalesReqDto } from './dto/req/target.sales.req.dto';
import { UsersUpdateReqDto } from './dto/req/user.status.update.req.dto';
import { AgencyDetailResDto } from './dto/res/agency.detail.res.dto';
import { AgencyListResDto } from './dto/res/agency.list.res.dto';
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
	@ApiResponse({ type: UserStatusResDto })
	async findUsersByStatus(
		@Query('page') page: number,
		@Query('pageSize') pageSize: number,
		@Query() query: UserStatusQueryDto,
	): Promise<{
		data: UserStatusResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.adminService.findUsersByStatus(query.status, page, pageSize);
	}

	// 가입 승인(단일, 다중 사용자)
	@Patch('approve')
	@ApiResponse({ type: UsersUpdateResultResDto })
	async approveUsers(
		@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: UsersUpdateReqDto,
	): Promise<UsersUpdateResultResDto> {
		const { userIds } = body;
		return this.adminService.updateUserStatus(userIds, 'approved');
	}

	// 가입 거절(단일, 다중 사용자)
	@Patch('decline')
	@ApiResponse({ type: UsersUpdateResultResDto })
	async declineUsers(
		@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: UsersUpdateReqDto,
	): Promise<UsersUpdateResultResDto> {
		const { userIds } = body;
		return this.adminService.updateUserStatus(userIds, 'declined');
	}

	// 가입된 광고주 목록 조회
	@Get('clients')
	@ApiResponse({ type: ClientListResDto })
	async getAllClients(
		@Query('page') page: number,
		@Query('pageSize') pageSize: number,
		@Query() clientListReqDto: ClientListReqDto,
	): Promise<{
		data: ClientListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.adminService.getAllClients(page, pageSize, clientListReqDto);
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
	@ApiResponse({ type: AgencyListResDto })
	async getAllAgencies(
		@Query('page') page: number,
		@Query('pageSize') pageSize: number,
		@Query() agencyListReqDto: AgencyListReqDto,
	): Promise<{
		data: AgencyListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.adminService.getAllAgencies(page, pageSize, agencyListReqDto);
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
	@ApiResponse({ type: CashRequestListResDto })
	async getChargeRequest(
		@Query('page') page: number,
		@Query('pageSize') pageSize: number,
	): Promise<{
		data: CashRequestListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.adminService.getChargeRequest(page, pageSize);
	}

	// 광고주 캐시 충전 요청 승인
	@Patch('charge-request/approve')
	@ApiResponse({ type: CashRequestListResDto })
	async approveChargeRequest(
		@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: CashRequestListReqDto,
	): Promise<{ updatedCashLogs: CashRequestListResDto[]; missingCashLogIds: string[] }> {
		return this.adminService.updateChargeRequest({ ...body, status: CashLogStatus.APPROVED });
	}

	// 광고주 캐시 충전 요청 거절
	@Patch('charge-request/decline')
	@ApiResponse({ type: CashRequestListResDto })
	async declineChargeRequest(
		@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: CashRequestListReqDto,
	): Promise<{ updatedCashLogs: CashRequestListResDto[]; missingCashLogIds: string[] }> {
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
}
