import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsArray } from "class-validator";

export class CheckPhoneRiskDto {
  @ApiProperty({ example: "01812-345678", description: "Bangladeshi recipient mobile number (11 digits)" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: "Karim Hasan", description: "Recipient name if available" })
  @IsOptional()
  @IsString()
  name?: string;
}

export class BatchScanRiskDto {
  @ApiProperty({
    example: ["01711234567", "01812345678", "01913456789"],
    description: "Array of phone numbers to evaluate in batch",
  })
  @IsArray()
  @IsString({ each: true })
  phones: string[];
}

export class ReportFraudDto {
  @ApiProperty({ example: "01812345678" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: "Karim Hasan" })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ example: "Repeatedly cancels orders after parcel arrives at hub" })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
