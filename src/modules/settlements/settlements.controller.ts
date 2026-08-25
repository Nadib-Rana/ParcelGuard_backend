import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SettlementsService } from "./settlements.service";
import { RaiseDisputeDto } from "./dto/settlement.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("COD Settlements & Reconciliation")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("bearer")
@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  @ApiOperation({ summary: "List merchant COD settlement statements & discrepancy audits" })
  @ResponseMessage("Settlements retrieved successfully")
  listSettlements(@CurrentUser("id") userId: string) {
    return this.settlementsService.listSettlements(userId);
  }

  @Post("dispute")
  @ApiOperation({ summary: "Raise COD shortage dispute ticket for a settlement" })
  @ResponseMessage("Dispute raised successfully")
  raiseDispute(
    @CurrentUser("id") userId: string,
    @Body() dto: RaiseDisputeDto,
  ) {
    return this.settlementsService.raiseDispute(userId, dto);
  }
}
