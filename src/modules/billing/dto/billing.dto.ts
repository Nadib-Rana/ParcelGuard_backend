import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";

export class InitiateCheckoutDto {
  @ApiProperty({ example: "Growth", description: "Target plan tier or top-up" })
  @IsNotEmpty()
  @IsString()
  planOrType: string;

  @ApiProperty({ example: 2499, description: "Amount in BDT" })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: "bKash", description: "bKash, Nagad, Card, Bank Transfer" })
  @IsNotEmpty()
  @IsString()
  method: string;

  @ApiPropertyOptional({ example: "BK99X8102A" })
  @IsOptional()
  @IsString()
  trxId?: string;
}
