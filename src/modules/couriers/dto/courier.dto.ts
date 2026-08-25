import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";

export class CourierRatesQueryDto {
  @ApiProperty({ example: "Dhaka" })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  codAmount?: number;
}

export class ConnectCourierDto {
  @ApiProperty({ example: "Steadfast" })
  @IsNotEmpty()
  @IsString()
  provider: string;

  @ApiProperty({ example: "sf_live_a89bc34e09f8" })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ example: "secret_token_123" })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiPropertyOptional({ example: "MRC-991" })
  @IsOptional()
  @IsString()
  merchantCourierId?: string;
}

export class ToggleCourierDto {
  @ApiProperty({ example: "Steadfast" })
  @IsNotEmpty()
  @IsString()
  provider: string;
}
