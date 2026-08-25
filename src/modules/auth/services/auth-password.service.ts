import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { MailService } from "../../mail/mail.service";
import { HashUtil } from "../../../common/utils/hash.util";
import { OtpUtil } from "../../../common/utils/otp.util";
import { OtpType } from "../../../common/enums";
import { ResetPasswordDto, ChangePasswordDto } from "../dto/auth.dto";

@Injectable()
export class AuthPasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        message:
          "If an account with that email exists, a password reset code has been sent.",
      };
    }

    const otp = OtpUtil.generateNumericOtp(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.otpToken.create({
      data: {
        email: user.email,
        code: otp,
        type: OtpType.PASSWORD_RESET,
        expiresAt,
        userId: user.id,
      },
    });

    void this.mailService.sendPasswordResetOtp(
      user.email,
      user.firstName || user.username || "User",
      otp,
      15,
    );

    return {
      message:
        "If an account with that email exists, a password reset code has been sent.",
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const otpRecord = await this.prisma.otpToken.findFirst({
      where: {
        email: normalizedEmail,
        code: dto.code.trim(),
        type: OtpType.PASSWORD_RESET,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new BadRequestException("Invalid or expired password reset code");
    }

    const newHashedPassword = await HashUtil.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: normalizedEmail },
        data: { password: newHashedPassword },
      }),
      this.prisma.otpToken.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
      this.prisma.refreshToken.updateMany({
        where: { user: { email: normalizedEmail } },
        data: { isRevoked: true },
      }),
    ]);

    return { message: "Password has been successfully reset. You can now login." };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isMatch = await HashUtil.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException("Incorrect current password");
    }

    const newHashedPassword = await HashUtil.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    return { message: "Password updated successfully" };
  }
}
