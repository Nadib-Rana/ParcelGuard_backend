import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { StorageService } from "./storage.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { ResponseMessage } from "../../common/decorators/response-message.decorator";
import { PresignUploadDto, PresignDownloadDto, DeleteObjectDto } from "./dto/storage.dto";

@ApiTags("Storage")
@Controller("storage")
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Post("presign-upload")
  @ApiOperation({ summary: "Generate a presigned upload URL for direct client-to-storage uploads" })
  @ResponseMessage("Presigned upload URL generated successfully")
  async getPresignUploadUrl(@Body() dto: PresignUploadDto) {
    const key = this.storageService.generateKey("uploads", dto.filename);
    return this.storageService.getPresignedUploadUrl(key, dto.bucket);
  }

  @Public()
  @Post("presign-download")
  @ApiOperation({ summary: "Generate a presigned download URL for viewing/downloading files" })
  @ResponseMessage("Presigned download URL generated successfully")
  async getPresignDownloadUrl(@Body() dto: PresignDownloadDto) {
    const url = await this.storageService.getPresignedObjectUrl(dto.key, dto.bucket);
    return { key: dto.key, downloadUrl: url };
  }

  @ApiBearerAuth()
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload file directly via server multipart form" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ResponseMessage("File uploaded successfully")
  async uploadFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided in request");
    }
    const key = this.storageService.generateKey("uploads", file.originalname);
    return this.storageService.uploadBuffer(key, file.buffer, file.mimetype);
  }

  @ApiBearerAuth()
  @Post("delete")
  @ApiOperation({ summary: "Delete an object from storage" })
  @ResponseMessage("Object deleted successfully")
  async deleteObject(@Body() dto: DeleteObjectDto) {
    const success = await this.storageService.deleteObject(dto.key, dto.bucket);
    return { success, key: dto.key };
  }
}
