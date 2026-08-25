import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { FraudService } from "./fraud.service";
import { CheckPhoneRiskDto, BatchScanRiskDto, ReportFraudDto } from "./dto/fraud.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Fraud Prevention")
@Controller("fraud")
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Post("check-phone")
  @ApiOperation({ summary: "Evaluate fraud & return risk score for a single mobile number" })
  @ResponseMessage("Phone risk evaluated successfully")
  async checkPhone(
    @Body() dto: CheckPhoneRiskDto,
    @CurrentUser("id") userId?: string,
  ) {
    return this.fraudService.evaluatePhoneRisk(dto);
  }

  @Post("batch-scan")
  @ApiOperation({ summary: "Batch evaluate fraud risk for multiple mobile numbers" })
  @ResponseMessage("Batch scan completed")
  async batchScan(
    @Body() dto: BatchScanRiskDto,
    @CurrentUser("id") userId?: string,
  ) {
    return this.fraudService.batchScan(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Post("report")
  @ApiOperation({ summary: "Report fraudulent customer to platform watchlist" })
  @ResponseMessage("Fraud report submitted for review")
  async reportFraud(
    @Body() dto: ReportFraudDto,
    @CurrentUser("id") userId?: string,
  ) {
    return this.fraudService.reportFraud(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Get("recent-checks")
  @ApiOperation({ summary: "Get recent fraud checks history" })
  @ResponseMessage("Recent checks retrieved")
  async getRecentChecks() {
    return this.fraudService.getRecentChecks();
  }
}
