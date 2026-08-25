import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { Public } from "./common/decorators/public.decorator";
import { ResponseMessage } from "./common/decorators/response-message.decorator";

@ApiTags("General")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get API starter status and information" })
  @ResponseMessage("API is operational")
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}
