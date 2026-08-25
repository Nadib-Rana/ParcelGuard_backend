import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean, IsEmail } from "class-validator";

export class UpdateMerchantDto {
  @ApiPropertyOptional({ example: "Rahman Fashion House" })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ example: "Rahman Fashion" })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional({ example: "+880 1711-234567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "merchant@store.bd" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "F-Commerce (Facebook)" })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ example: "House 12, Road 4, Sector 3, Uttara, Dhaka" })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({ example: "Dhaka" })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: "https://rahmanstore.com/api/webhooks/parcelguard" })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyParcelUpdates?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyPaymentUpdates?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyHighRiskAlerts?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  notifySms?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyEmail?: boolean;
}
