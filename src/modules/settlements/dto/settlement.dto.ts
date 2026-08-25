import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";

export class RaiseDisputeDto {
  @ApiProperty({ example: "STL-2408-002" })
  @IsNotEmpty()
  @IsString()
  settlementId: string;

  @ApiProperty({ example: "COD deduction of ৳2,500 on 2 delivered parcels marked incorrectly as returned." })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  disputedAmount?: number;
}
