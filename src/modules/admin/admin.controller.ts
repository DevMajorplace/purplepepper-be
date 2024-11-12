import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserStatusResDto } from '../admin/dto/res/user.status.res.dto';
import { UserStatusUpdateResDto } from '../admin/dto/res/user.status.update.res.dto';
import { UserStatusQueryDto } from '../admin/dto/user-status-query.dto';
import { AdminService } from './admin.service';
import { ClientNameReqDto } from './dto/req/client.name.req.dto';
import { RangeReqDto } from './dto/req/range.req.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}
	// 가입 대기/거절 회원 조회
	@Get('status')
	async findUsersByStatus(@Query() query: UserStatusQueryDto): Promise<UserStatusResDto[]> {
		return this.adminService.findUsersByStatus(query.status);
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

	// 가입된 광고주 조회
	@Get('clients')
	async getAllClients(@Query() rangeReqDto: RangeReqDto): Promise<ClientListResDto[]> {
		return this.adminService.getClients(rangeReqDto);
	}

	// 광고주 업체명 검색
	@Get('client')
	async getClientByName(@Query() clientNameReqDto: ClientNameReqDto): Promise<ClientListResDto[]> {
		return this.adminService.getClientsByName(clientNameReqDto);
	}
}
