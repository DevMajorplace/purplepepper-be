import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DashboardService } from './dashboard.service';
import { ClientStatResDto } from './dto/res/client.number.res.dto';
import { NoticeResDto } from './dto/res/notice.res.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	// 최신 공지사항 제목 조회
	@Get('latest-notice')
	@ApiResponse({ type: NoticeResDto })
	async getLatestNoticeTitle(@Req() req: any): Promise<NoticeResDto> {
		return this.dashboardService.getLatestNoticeTitle(req);
	}

	// 하위 광고주 수 조회
	@Get('clients-stat')
	@ApiResponse({ type: ClientStatResDto })
	async getClientsCount(@Req() req: any): Promise<ClientStatResDto> {
		return this.dashboardService.getClientsStat(req);
	}
}
