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
import { BillingService } from "./billing.service";
import { InitiateCheckoutDto } from "./dto/billing.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Billing & Subscriptions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("bearer")
@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("subscription")
  @ApiOperation({ summary: "Get current subscription tier, quota usage and plans" })
  @ResponseMessage("Subscription details retrieved")
  getSubscription(@CurrentUser("id") userId: string) {
    return this.billingService.getSubscriptionDetails(userId);
  }

  @Post("checkout")
  @ApiOperation({ summary: "Initiate MFS checkout (bKash/Nagad/Card) for plan or credits" })
  @ResponseMessage("Checkout processed")
  checkout(
    @CurrentUser("id") userId: string,
    @Body() dto: InitiateCheckoutDto,
  ) {
    return this.billingService.initiateCheckout(userId, dto);
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get billing transaction history" })
  @ResponseMessage("Transactions retrieved")
  getTransactions(@CurrentUser("id") userId: string) {
    return this.billingService.getTransactions(userId);
  }
}
