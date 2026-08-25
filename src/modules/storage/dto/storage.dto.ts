import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class PresignUploadDto {
  @ApiProperty({
    description: "The intended filename or object key",
    example: "avatars/user-123.png",
  })
  @IsNotEmpty()
  @IsString()
  filename: string;

  @ApiPropertyOptional({
    description: "MIME type of the file",
    example: "image/png",
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: "Target bucket (optional, uses default if omitted)",
  })
  @IsOptional()
  @IsString()
  bucket?: string;
}

export class PresignDownloadDto {
  @ApiProperty({
    description: "The object key to download/view",
    example: "avatars/user-123.png",
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiPropertyOptional({
    description: "Target bucket (optional)",
  })
  @IsOptional()
  @IsString()
  bucket?: string;
}

export class DeleteObjectDto {
  @ApiProperty({
    description: "The object key to delete",
    example: "avatars/user-123.png",
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiPropertyOptional({
    description: "Target bucket (optional)",
  })
  @IsOptional()
  @IsString()
  bucket?: string;
}
