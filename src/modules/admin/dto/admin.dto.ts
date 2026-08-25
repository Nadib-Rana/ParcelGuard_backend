import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";

export class UpdateMerchantStatusDto {
  @ApiProperty({ example: "Active" })
  @IsNotEmpty()
  @IsString()
  status: string;
}

export class UpdateMerchantPlanDto {
  @ApiProperty({ example: "Growth" })
  @IsNotEmpty()
  @IsString()
  plan: string;
}

export class AddBlacklistDto {
  @ApiProperty({ example: "01812345678" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: "Karim Hasan" })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ example: 94 })
  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @ApiProperty({ example: "Confirmed repeated refusals" })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: "Confirmed Fraud" })
  @IsOptional()
  @IsString()
  status?: string;
}

export class SendBroadcastDto {
  @ApiProperty({ example: "RedX API Latency Notice" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: "RedX booking API is currently experiencing slight dispatch latency." })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ example: "warning" })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: "All Merchants" })
  @IsNotEmpty()
  @IsString()
  target: string;
}

export class ToggleCourierHealthDto {
  @ApiProperty({ example: "Steadfast" })
  @IsNotEmpty()
  @IsString()
  provider: string;
}

export class UpdateMasterCourierDto {
  @ApiProperty({ example: "Steadfast" })
  @IsNotEmpty()
  @IsString()
  provider: string;

  @ApiPropertyOptional({ example: "your_api_key" })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: "your_secret_key" })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}

export class CreateCourierGatewayDto {
  @ApiProperty({ example: "eCourier" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "EC" })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: "bg-cyan-600" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: "https://api.ecourier.com.bd/api/v1" })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional({ example: "api_key_123" })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: "secret_123" })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestCourierConnectionDto {
  @ApiProperty({ example: "Steadfast" })
  @IsNotEmpty()
  @IsString()
  provider: string;
}
