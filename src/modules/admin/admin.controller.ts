import { Body, Controller, Get, Patch, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from '../admin/dto/res/user.status.update.res.dto';
import { UserStatusQueryDto } from '../admin/dto/user-status-query.dto';
import { AdminService } from './admin.service';
import { ClientDetailReqDto } from './dto/req/client.detail.req.dto';
import { ClientListReqDto } from './dto/req/client.list.req.dto';
import { ClientDetailResDto } from './dto/res/client.detail.res.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}
	// 가입 대기/거절 회원 조회
	@Get('status')
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
	async approveUsers(
		@Body() userIds: string[],
	): Promise<{ updatedUsers: UserStatusUpdateResDto[]; missingUserIds: string[] }> {
		return this.adminService.updateUserStatus(userIds, 'approved');
	}

	// 가입 거절(단일, 다중 사용자)
	@Patch('decline')
	async declineUsers(
		@Body() userIds: string[],
	): Promise<{ updatedUsers: UserStatusUpdateResDto[]; missingUserIds: string[] }> {
		return this.adminService.updateUserStatus(userIds, 'declined');
	}

	// 가입된 광고주 목록 조회
	@Get('clients')
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
		return this.adminService.getClients(page, pageSize, clientListReqDto);
	}

	// 단일 광고주 상세 조회
	@Get('client')
	async getClientDetail(@Query('userId') userId: string): Promise<ClientDetailResDto> {
		return this.adminService.getClientDetail(userId);
	}

	// 단일 광고주 상세 정보 변경
	@Patch('client')
	@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
	async updateClientDetail(
		@Query('userId') userId: string,
		@Body() clientDetailReqDto: ClientDetailReqDto,
	): Promise<ClientDetailResDto> {
		return this.adminService.updateClientDetail(userId, clientDetailReqDto);
	}
}
