import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ParcelsService } from "./parcels.service";
import {
  CreateParcelDto,
  BulkCreateParcelsDto,
  FilterParcelsDto,
  UpdateParcelStatusDto,
} from "./dto/parcel.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Parcels & Shipping")
@Controller("parcels")
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Post()
  @ApiOperation({ summary: "Book a new parcel with real-time risk check and courier booking" })
  @ResponseMessage("Parcel booked successfully")
  createParcel(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateParcelDto,
  ) {
    return this.parcelsService.createParcel(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Post("bulk")
  @ApiOperation({ summary: "Bulk create parcels from verified CSV/Excel import" })
  @ResponseMessage("Bulk parcels created successfully")
  bulkCreateParcels(
    @CurrentUser("id") userId: string,
    @Body() dto: BulkCreateParcelsDto,
  ) {
    return this.parcelsService.bulkCreateParcels(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Get()
  @ApiOperation({ summary: "List merchant parcels with filters & pagination" })
  @ResponseMessage("Parcels retrieved successfully")
  listParcels(
    @CurrentUser("id") userId: string,
    @Query() filter: FilterParcelsDto,
  ) {
    return this.parcelsService.listParcels(userId, filter);
  }

  @Public()
  @Get("track/:trackingId")
  @ApiOperation({ summary: "Public milestone tracking lookup" })
  @ResponseMessage("Tracking information retrieved")
  trackPublic(@Param("trackingId") trackingId: string) {
    return this.parcelsService.trackParcelPublic(trackingId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Get(":id")
  @ApiOperation({ summary: "Get single parcel details and timeline" })
  @ResponseMessage("Parcel details retrieved")
  getParcelById(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.parcelsService.getParcelById(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("bearer")
  @Patch(":id/status")
  @ApiOperation({ summary: "Update parcel delivery status" })
  @ResponseMessage("Parcel status updated")
  updateStatus(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateParcelStatusDto,
  ) {
    return this.parcelsService.updateParcelStatus(userId, id, dto);
  }
}
