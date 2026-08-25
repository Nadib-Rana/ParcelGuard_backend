import {
  Controller,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { LabelsService } from "./labels.service";
import { GenerateLabelsDto } from "./dto/label.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Thermal Shipping Labels")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("bearer")
@Controller("labels")
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post("generate")
  @ApiOperation({ summary: "Generate batch 4x6 thermal barcode labels layout" })
  @ResponseMessage("Thermal labels generated successfully")
  generateLabels(
    @CurrentUser("id") userId: string,
    @Body() dto: GenerateLabelsDto,
  ) {
    return this.labelsService.generateThermalLabels(userId, dto);
  }
}
