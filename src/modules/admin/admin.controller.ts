import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import {
  UpdateMerchantStatusDto,
  UpdateMerchantPlanDto,
  AddBlacklistDto,
  SendBroadcastDto,
  ToggleCourierHealthDto,
  UpdateMasterCourierDto,
  CreateCourierGatewayDto,
  TestCourierConnectionDto,
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
  @ResponseMessage("Dashboard telemetry retrieved")
  getDashboard() { return this.adminService.getDashboardTelemetry(); }

  @Get("merchants")
  @ResponseMessage("Merchants retrieved")
  listMerchants() { return this.adminService.listMerchants(); }

  @Patch("merchants/:id/status")
  @ResponseMessage("Merchant status updated")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateMerchantStatusDto) {
    return this.adminService.updateMerchantStatus(id, dto);
  }

  @Patch("merchants/:id/plan")
  @ResponseMessage("Merchant plan updated")
  updatePlan(@Param("id") id: string, @Body() dto: UpdateMerchantPlanDto) {
    return this.adminService.updateMerchantPlan(id, dto);
  }

  @Get("couriers/health")
  @ResponseMessage("Courier health retrieved")
  getCourierHealth() { return this.adminService.getCourierHealth(); }

  @Post("couriers")
  @ResponseMessage("New courier gateway registered")
  addCourierGateway(@Body() dto: CreateCourierGatewayDto) {
    return this.adminService.addCourierGateway(dto);
  }

  @Delete("couriers/:provider")
  @ResponseMessage("Courier gateway removed")
  deleteCourierGateway(@Param("provider") provider: string) {
    return this.adminService.deleteCourierGateway(provider);
  }

  @Post("couriers/credentials")
  @ResponseMessage("Master courier credentials updated")
  updateMasterCredentials(@Body() dto: UpdateMasterCourierDto) {
    return this.adminService.updateMasterCredentials(dto);
  }

  @Post("couriers/test")
  @ResponseMessage("Courier connection test completed")
  testCourierConnection(@Body() dto: TestCourierConnectionDto) {
    return this.adminService.testCourierConnection(dto.provider);
  }

  @Post("couriers/toggle-health")
  @ResponseMessage("Courier health toggled")
  toggleCourierHealth(@Body() dto: ToggleCourierHealthDto) {
    return this.adminService.toggleCourierHealth(dto);
  }

  @Get("blacklist")
  @ResponseMessage("Global blacklist retrieved")
  getBlacklist() { return this.adminService.getBlacklist(); }

  @Post("blacklist")
  @ResponseMessage("Blacklist entry added")
  addBlacklist(@Body() dto: AddBlacklistDto) { return this.adminService.addBlacklistEntry(dto); }

  @Delete("blacklist/:id")
  @ResponseMessage("Blacklist entry removed")
  removeBlacklist(@Param("id") id: string) { return this.adminService.removeBlacklistEntry(id); }

  @Get("finance/transactions")
  @ResponseMessage("Platform transactions retrieved")
  getTransactions() { return this.adminService.getTransactions(); }

  @Get("broadcasts")
  @ResponseMessage("Broadcasts retrieved")
  getBroadcasts() { return this.adminService.getBroadcasts(); }

  @Post("broadcasts")
  @ResponseMessage("Broadcast sent successfully")
  sendBroadcast(@Body() dto: SendBroadcastDto) { return this.adminService.sendBroadcast(dto); }

  @Post("maintenance/toggle")
  @ResponseMessage("Maintenance mode updated")
  toggleMaintenance() { return this.adminService.toggleMaintenanceMode(); }
}
