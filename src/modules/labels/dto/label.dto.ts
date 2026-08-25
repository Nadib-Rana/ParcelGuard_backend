import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class GenerateLabelsDto {
  @ApiProperty({
    example: ["PG-102845", "PG-102846"],
    description: "Array of Parcel IDs / Tracking IDs to generate thermal labels for",
  })
  @IsArray()
  @IsString({ each: true })
  parcelIds: string[];
}
