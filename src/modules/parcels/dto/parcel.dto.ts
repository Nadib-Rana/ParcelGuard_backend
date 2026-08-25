import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateParcelDto {
  @ApiProperty({ example: "Rahim Uddin" })
  @IsNotEmpty()
  @IsString()
  customer: string;

  @ApiProperty({ example: "01711-234567" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: "Road 5, Mirpur-10" })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: "Dhaka" })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiPropertyOptional({ example: "Mirpur-10" })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiProperty({ example: "Cotton Shirt" })
  @IsNotEmpty()
  @IsString()
  product: string;

  @ApiPropertyOptional({ example: "Fashion" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ example: "Steadfast" })
  @IsNotEmpty()
  @IsString()
  courier: string;

  @ApiProperty({ example: 1250 })
  @IsNotEmpty()
  @IsNumber()
  cod: number;

  @ApiPropertyOptional({ example: 110 })
  @IsOptional()
  @IsNumber()
  charge?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  advance?: number;

  @ApiPropertyOptional({ example: "Safe" })
  @IsOptional()
  @IsString()
  risk?: string;

  @ApiPropertyOptional({ example: "Pending Pickup" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: "Fragile item" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkCreateParcelsDto {
  @ApiProperty({ type: [CreateParcelDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParcelDto)
  parcels: CreateParcelDto[];
}

export class FilterParcelsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  risk?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class UpdateParcelStatusDto {
  @ApiProperty({ example: "Delivered" })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: "Customer received and paid COD" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: "Mirpur Hub" })
  @IsOptional()
  @IsString()
  location?: string;
}
