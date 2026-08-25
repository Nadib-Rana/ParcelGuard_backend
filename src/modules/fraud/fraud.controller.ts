import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
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
import { PrismaService } from "../../database/prisma.service";

@ApiTags("Fraud Prevention")
@Controller("fraud")
export class FraudController {
  constructor(
    private readonly fraudService: FraudService,
    private readonly prisma: PrismaService,
  ) {}

  private async getMerchantId(userId?: string): Promise<string | undefined> {
    if (!userId) return undefined;
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id;
  }

  @Public()
  @Post("check-phone")
  @ApiOperation({ summary: "Evaluate fraud & return risk score for a single mobile number" })
  @ResponseMessage("Phone risk evaluated successfully")
  async checkPhone(
    @Body() dto: CheckPhoneRiskDto,
    @CurrentUser("id") userId?: string,
  ) {
    const merchantId = await this.getMerchantId(userId);
    return this.fraudService.evaluatePhoneRisk(dto, merchantId);
  }

  @Public()
  @Post("batch-scan")
  @ApiOperation({ summary: "Batch evaluate fraud risk for multiple mobile numbers" })
  @ResponseMessage("Batch scan completed")
  async batchScan(
    @Body() dto: BatchScanRiskDto,
    @CurrentUser("id") userId?: string,
  ) {
    const merchantId = await this.getMerchantId(userId);
    return this.fraudService.batchScan(dto, merchantId);
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
    const merchantId = await this.getMerchantId(userId);
    return this.fraudService.reportFraud(dto, merchantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Get("recent-checks")
  @ApiOperation({ summary: "Get recent fraud checks history from database" })
  @ResponseMessage("Recent checks retrieved")
  async getRecentChecks(@CurrentUser("id") userId?: string) {
    const merchantId = await this.getMerchantId(userId);
    return this.fraudService.getRecentChecks(merchantId);
  }
}
