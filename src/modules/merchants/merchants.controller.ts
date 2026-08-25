import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { MerchantsService } from "./merchants.service";
import { UpdateMerchantDto } from "./dto/update-merchant.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Merchants")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard)
@Controller("merchants")
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current merchant profile, balances and settings" })
  @ResponseMessage("Merchant profile retrieved successfully")
  async getProfile(@CurrentUser("id") userId: string) {
    return this.merchantsService.getProfileByUserId(userId);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update merchant profile, business info, or notification preferences" })
  @ResponseMessage("Merchant profile updated successfully")
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateMerchantDto,
  ) {
    return this.merchantsService.updateProfile(userId, dto);
  }

  @Post("api-keys/regenerate")
  @ApiOperation({ summary: "Regenerate merchant public REST API key" })
  @ResponseMessage("API key regenerated successfully")
  async regenerateApiKey(@CurrentUser("id") userId: string) {
    return this.merchantsService.regenerateApiKey(userId);
  }
}
