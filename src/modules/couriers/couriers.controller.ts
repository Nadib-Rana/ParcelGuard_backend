import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CouriersService } from "./couriers.service";
import { CourierRatesQueryDto, ConnectCourierDto, ToggleCourierDto } from "./dto/courier.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Couriers & Rates")
@Controller("couriers")
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Get("rates")
  @ApiOperation({ summary: "Get live rate comparison across all supported couriers" })
  @ResponseMessage("Courier rates calculated")
  getRates(@Query() query: CourierRatesQueryDto) {
    return this.couriersService.calculateLiveRates(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Get("accounts")
  @ApiOperation({ summary: "Get merchant connected courier accounts and balances" })
  @ResponseMessage("Courier accounts retrieved")
  getAccounts(@CurrentUser("id") userId: string) {
    return this.couriersService.getMerchantCouriers(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Post("connect")
  @ApiOperation({ summary: "Connect or update courier API credentials" })
  @ResponseMessage("Courier account updated")
  connectCourier(
    @CurrentUser("id") userId: string,
    @Body() dto: ConnectCourierDto,
  ) {
    return this.couriersService.connectCourier(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Post("toggle")
  @ApiOperation({ summary: "Toggle connection state for a courier" })
  @ResponseMessage("Courier status toggled")
  toggleCourier(
    @CurrentUser("id") userId: string,
    @Body() dto: ToggleCourierDto,
  ) {
    return this.couriersService.toggleCourier(userId, dto.provider);
  }
}
