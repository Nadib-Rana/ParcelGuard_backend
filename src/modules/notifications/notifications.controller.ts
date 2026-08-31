import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";

@ApiTags("Notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("bearer")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get merchant notification feed" })
  @ResponseMessage("Notifications retrieved")
  getNotifications(@CurrentUser("id") userId: string) {
    return this.notificationsService.listNotifications(userId);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark single notification as read" })
  @ResponseMessage("Notification marked as read")
  markAsRead(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ResponseMessage("All notifications marked as read")
  markAllAsRead(@CurrentUser("id") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete("clear-read")
  @ApiOperation({ summary: "Clear all read notifications" })
  @ResponseMessage("All read notifications cleared")
  clearReadNotifications(@CurrentUser("id") userId: string) {
    return this.notificationsService.clearReadNotifications(userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a single notification" })
  @ResponseMessage("Notification deleted successfully")
  deleteNotification(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.notificationsService.deleteNotification(userId, id);
  }
}
