import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientListReqDto } from '../admin/dto/req/client.list.req.dto';
import { ClientListResDto } from '../admin/dto/res/client.list.res.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRoles } from '../auth/types/role.decorator';
import { Role } from '../auth/types/role.enum';
import { AgencyService } from './agency.service';

@ApiTags('Agency')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
@Controller('agency')
export class AgencyController {
	constructor(private readonly agencyService: AgencyService) {}

	// 가입된 광고주 목록 조회
	@Get('clients')
	@UserRoles(Role.Agency)
	async getAllClients(
		@Query('page') page: number,
		@Query('pageSize') pageSize: number,
		@Query() clientListReqDto: ClientListReqDto,
		@Req() req: Request,
	): Promise<{
		data: ClientListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.agencyService.getAllClients(page, pageSize, clientListReqDto, req);
	}
}
