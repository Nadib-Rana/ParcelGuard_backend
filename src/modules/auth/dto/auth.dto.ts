import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com", description: "User email address" })
  @IsEmail({}, { message: "Please enter a valid email address" })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "Password123!",
    description: "Password (min 6 characters)",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;

  @ApiPropertyOptional({ example: "john_doe", description: "Unique username" })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: "John", description: "First name" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: "Doe", description: "Last name" })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: "+1234567890", description: "Phone number" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class LoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email or username to login",
  })
  @IsNotEmpty({ message: "Email or username is required" })
  @IsString()
  identifier: string;

  @ApiProperty({ example: "Password123!", description: "Account password" })
  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token received during login or token rotation",
  })
  @IsNotEmpty({ message: "Refresh token is required" })
  @IsString()
  refreshToken: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456", description: "6-digit OTP code" })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456", description: "6-digit OTP code" })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: "NewSecretPassword123!", minLength: 6 })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: "OldPassword123!" })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: "NewPassword123!", minLength: 6 })
  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters long" })
  newPassword: string;
}
