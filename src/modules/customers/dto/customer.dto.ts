import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class AddCustomerNoteDto {
  @ApiProperty({ example: "Customer is responsive on phone, fast delivery." })
  @IsNotEmpty()
  @IsString()
  notes: string;
}

export class FilterCustomersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  risk?: string;
}
