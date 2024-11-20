import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UserRoles } from '../auth/types/role.decorator';
import { Role } from '../auth/types/role.enum';
import { ClientService } from './client.service';
import { ChargeCashReqDto } from './dto/req/charge.cash.req.dto';
import { ChargeCashResDto } from './dto/res/charge.cash.res.dto';

@ApiTags('Client')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RoleGuard)
@UserRoles(Role.Client)
@Controller('client')
export class ClientController {
	constructor(private readonly clientService: ClientService) {}

	// 캐시 충전
	@Post('charge')
	@ApiResponse({ type: ChargeCashResDto })
	async chargeCash(
		@Req() req: any,
		@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) chargeCashReqDto: ChargeCashReqDto,
	): Promise<ChargeCashResDto> {
		return this.clientService.chargeCash(req, chargeCashReqDto);
	}
}
