import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import {
  UpdateMerchantStatusDto,
  UpdateMerchantPlanDto,
  AddBlacklistDto,
  SendBroadcastDto,
  ToggleCourierHealthDto,
} from "./dto/admin.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";
import { Role } from "../../common/enums";

@ApiTags("Super Admin Console")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@ApiBearerAuth("bearer")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Get platform-wide telemetry & MRR" })
  @ResponseMessage("Dashboard telemetry retrieved")
  getDashboard() {
    return this.adminService.getDashboardTelemetry();
  }

  @Get("merchants")
  @ApiOperation({ summary: "Get all merchant tenants" })
  @ResponseMessage("Merchants retrieved")
  listMerchants() {
    return this.adminService.listMerchants();
  }

  @Patch("merchants/:id/status")
  @ApiOperation({ summary: "Suspend or activate merchant" })
  @ResponseMessage("Merchant status updated")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateMerchantStatusDto,
  ) {
    return this.adminService.updateMerchantStatus(id, dto);
  }

  @Patch("merchants/:id/plan")
  @ApiOperation({ summary: "Change merchant plan tier" })
  @ResponseMessage("Merchant plan updated")
  updatePlan(
    @Param("id") id: string,
    @Body() dto: UpdateMerchantPlanDto,
  ) {
    return this.adminService.updateMerchantPlan(id, dto);
  }

  @Get("couriers/health")
  @ApiOperation({ summary: "Get courier API latency & health telemetry" })
  @ResponseMessage("Courier health retrieved")
  getCourierHealth() {
    return this.adminService.getCourierHealth();
  }

  @Post("couriers/toggle-health")
  @ApiOperation({ summary: "Toggle courier operational state" })
  @ResponseMessage("Courier health toggled")
  toggleCourierHealth(@Body() dto: ToggleCourierHealthDto) {
    return this.adminService.toggleCourierHealth(dto);
  }

  @Get("blacklist")
  @ApiOperation({ summary: "Get global fraud blacklist" })
  @ResponseMessage("Global blacklist retrieved")
  getBlacklist() {
    return this.adminService.getBlacklist();
  }

  @Post("blacklist")
  @ApiOperation({ summary: "Add phone number to global blacklist" })
  @ResponseMessage("Blacklist entry added")
  addBlacklist(@Body() dto: AddBlacklistDto) {
    return this.adminService.addBlacklistEntry(dto);
  }

  @Delete("blacklist/:id")
  @ApiOperation({ summary: "Remove phone number from global blacklist" })
  @ResponseMessage("Blacklist entry removed")
  removeBlacklist(@Param("id") id: string) {
    return this.adminService.removeBlacklistEntry(id);
  }

  @Get("finance/transactions")
  @ApiOperation({ summary: "Get all platform billing transactions" })
  @ResponseMessage("Platform transactions retrieved")
  getTransactions() {
    return this.adminService.getTransactions();
  }

  @Get("broadcasts")
  @ApiOperation({ summary: "Get all system broadcasts" })
  @ResponseMessage("Broadcasts retrieved")
  getBroadcasts() {
    return this.adminService.getBroadcasts();
  }

  @Post("broadcasts")
  @ApiOperation({ summary: "Send system broadcast to merchant portals" })
  @ResponseMessage("Broadcast sent successfully")
  sendBroadcast(@Body() dto: SendBroadcastDto) {
    return this.adminService.sendBroadcast(dto);
  }

  @Post("maintenance/toggle")
  @ApiOperation({ summary: "Toggle global maintenance mode" })
  @ResponseMessage("Maintenance mode updated")
  toggleMaintenance() {
    return this.adminService.toggleMaintenanceMode();
  }
}
