import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Analytics & Reports")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("bearer")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  @ApiOperation({ summary: "Get merchant analytics KPI & visual distribution reports" })
  @ResponseMessage("Analytics data retrieved successfully")
  getOverview(
    @CurrentUser("id") userId: string,
    @Query("timeRange") timeRange?: string,
  ) {
    return this.analyticsService.getOverview(userId, timeRange);
  }
}
