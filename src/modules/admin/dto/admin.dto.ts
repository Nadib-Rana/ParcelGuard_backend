import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";

export class UpdateMerchantStatusDto {
  @ApiProperty({ example: "Active", description: "Active | Suspended | Trial" })
  @IsNotEmpty()
  @IsString()
  status: string;
}

export class UpdateMerchantPlanDto {
  @ApiProperty({ example: "Growth", description: "Starter | Growth | Enterprise" })
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

  @ApiProperty({ example: "warning", description: "info | warning | urgent | maintenance" })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: "All Merchants", description: "All Merchants | Starter | Growth | Enterprise" })
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
