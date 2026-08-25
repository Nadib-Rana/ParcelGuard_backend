import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../database/prisma.service";
import { HashUtil } from "../../../common/utils/hash.util";
import { UserStatus } from "../../../common/enums";

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(user: {
    id: string;
    email: string;
    role: string;
    username?: string | null;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username || undefined,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        "jwt.secret",
        "default_super_secret_jwt_key_change_in_production_12345",
      ),
      expiresIn: (this.configService.get<string>("jwt.expiresIn") || "15m") as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        "jwt.refreshSecret",
        "default_super_secret_jwt_refresh_key_change_in_production_12345",
      ),
      expiresIn: (this.configService.get<string>("jwt.refreshExpiresIn") || "7d") as any,
    });

    return { accessToken, refreshToken };
  }

  async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokenHash = await HashUtil.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        device: userAgent,
        ipAddress,
        expiresAt,
      },
    });
  }

  async refreshToken(refreshToken: string, ipAddress?: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          "jwt.refreshSecret",
          "default_super_secret_jwt_refresh_key_change_in_production_12345",
        ),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException("Invalid refresh token or inactive account");
      }

      const newTokens = this.generateTokens(user);
      await this.createSession(user.id, newTokens.refreshToken, ipAddress);

      return newTokens;
    } catch {
      throw new UnauthorizedException("Refresh token is expired or invalid");
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return { message: "Logged out successfully" };
  }
}
