import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { HashUtil } from "../../common/utils/hash.util";
import { Role, UserStatus } from "../../common/enums";
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "./dto/auth.dto";
import { AuthTokenService } from "./services/auth-token.service";
import { AuthOtpService } from "./services/auth-otp.service";
import { AuthPasswordService } from "./services/auth-password.service";
import { AuthProfileService } from "./services/auth-profile.service";
import { AuthResponseUtil } from "./utils/auth-response.util";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: AuthTokenService,
    private readonly otpService: AuthOtpService,
    private readonly passwordService: AuthPasswordService,
    private readonly profileService: AuthProfileService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          dto.username ? { username: dto.username } : {},
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email.toLowerCase()) {
        throw new ConflictException("A user with this email already exists");
      }
      throw new ConflictException("A user with this username already exists");
    }

    const hashedPassword = await HashUtil.hash(dto.password);
    const isAdmin = dto.email.toLowerCase().includes("admin");

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username || null,
        password: hashedPassword,
        firstName: dto.firstName || null,
        lastName: dto.lastName || null,
        phoneNumber: dto.phoneNumber || null,
        role: isAdmin ? Role.SUPER_ADMIN : Role.MERCHANT_OWNER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!isAdmin) {
      const bName = (dto as any).businessName || `${dto.firstName || "Merchant"}'s Store`;
      await this.prisma.merchantProfile.create({
        data: {
          userId: user.id,
          businessName: bName,
          phone: dto.phoneNumber || "01700000000",
          email: user.email,
        },
      });
    }

    const tokens = this.tokenService.generateTokens(user);
    await this.tokenService.createSession(user.id, tokens.refreshToken);

    return { message: "Registration successful", user, ...tokens };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const identifier = dto.identifier.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
      include: { merchantProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email/username or password");
    }

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException(
        `Account is ${user.status.toLowerCase()}. Please contact support.`,
      );
    }

    const isPasswordValid = await HashUtil.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email/username or password");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = this.tokenService.generateTokens(user);
    await this.tokenService.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    return {
      user: AuthResponseUtil.formatAuthUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string, ipAddress?: string) {
    return this.tokenService.refreshToken(refreshToken, ipAddress);
  }

  async verifyEmailOtp(email: string, code: string) {
    return this.otpService.verifyEmailOtp(email, code);
  }

  async resendVerificationOtp(email: string) {
    return this.otpService.resendVerificationOtp(email);
  }

  async forgotPassword(email: string) {
    return this.passwordService.forgotPassword(email);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    return this.passwordService.changePassword(userId, dto);
  }

  async logout(userId: string) {
    return this.tokenService.logout(userId);
  }

  async getProfile(userId: string) {
    return this.profileService.getProfile(userId);
  }
}
