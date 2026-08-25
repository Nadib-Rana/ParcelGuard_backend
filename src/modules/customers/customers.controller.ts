import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { FilterCustomersDto, AddCustomerNoteDto } from "./dto/customer.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Customers Intelligence")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("bearer")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: "List merchant customer directory" })
  @ResponseMessage("Customers retrieved successfully")
  listCustomers(
    @CurrentUser("id") userId: string,
    @Query() filter: FilterCustomersDto,
  ) {
    return this.customersService.listCustomers(userId, filter);
  }

  @Patch(":phone/watchlist")
  @ApiOperation({ summary: "Toggle customer merchant watchlist flag" })
  @ResponseMessage("Watchlist status updated")
  toggleWatchlist(
    @CurrentUser("id") userId: string,
    @Param("phone") phone: string,
  ) {
    return this.customersService.toggleWatchlist(userId, phone);
  }

  @Post(":phone/notes")
  @ApiOperation({ summary: "Add or update private merchant notes for a customer" })
  @ResponseMessage("Customer note saved")
  addNote(
    @CurrentUser("id") userId: string,
    @Param("phone") phone: string,
    @Body() dto: AddCustomerNoteDto,
  ) {
    return this.customersService.addNote(userId, phone, dto);
  }
}
