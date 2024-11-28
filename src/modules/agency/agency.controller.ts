import { Controller, Get, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
// import { ClientListReqDto } from '../admin/dto/req/client.list.req.dto';
// import { ClientListResDto } from '../admin/dto/res/client.list.res.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRoles } from '../auth/types/role.decorator';
import { Role } from '../auth/types/role.enum';
import { AgencyService } from './agency.service';
import { ClientListReqDto } from './dto/req/client.list.req.dto';
import { ClientListResDto } from './dto/res/client.list.res.dto';

@ApiTags('Agency')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
@Controller('agency')
export class AgencyController {
	constructor(private readonly agencyService: AgencyService) {}

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
	@UserRoles(Role.Agency)
	async getAllClients(
		@Query() clientListReqDto: ClientListReqDto,
		@Req() req: Request,
	): Promise<{
		data: ClientListResDto[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	}> {
		return this.agencyService.getAllClients(clientListReqDto.page, clientListReqDto.pageSize, clientListReqDto, req);
	}
}
