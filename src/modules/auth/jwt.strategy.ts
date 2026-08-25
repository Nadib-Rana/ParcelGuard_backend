import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { UserStatus } from "../../common/enums";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  username?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        "jwt.secret",
        "default_super_secret_jwt_key_change_in_production_12345",
      ),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        status: true,
        isEmailVerified: true,
        merchantProfile: {
          select: {
            id: true,
            businessName: true,
            plan: true,
            status: true,
            balance: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found or token is invalid");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        `Your account is currently ${user.status.toLowerCase()}. Please contact support.`,
      );
    }

    return user;
  }
}
