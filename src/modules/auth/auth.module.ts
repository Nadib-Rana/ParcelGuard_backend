import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthTokenService } from "./services/auth-token.service";
import { AuthOtpService } from "./services/auth-otp.service";
import { AuthPasswordService } from "./services/auth-password.service";
import { AuthProfileService } from "./services/auth-profile.service";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>(
          "jwt.secret",
          "default_super_secret_jwt_key_change_in_production_12345",
        ),
        signOptions: {
          expiresIn: (config.get<string>("jwt.expiresIn") || "15m") as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthOtpService,
    AuthPasswordService,
    AuthProfileService,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    AuthTokenService,
    AuthOtpService,
    AuthPasswordService,
    AuthProfileService,
    JwtStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
