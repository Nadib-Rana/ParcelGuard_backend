import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { MailService } from "../../mail/mail.service";
import { OtpUtil } from "../../../common/utils/otp.util";
import { OtpType } from "../../../common/enums";

@Injectable()
export class AuthOtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async verifyEmailOtp(email: string, code: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await this.prisma.otpToken.findFirst({
      where: {
        email: normalizedEmail,
        code: code.trim(),
        type: OtpType.EMAIL_VERIFICATION,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    await this.prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const user = await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: { isEmailVerified: true },
      select: {
        id: true,
        email: true,
        username: true,
        isEmailVerified: true,
      },
    });

    return {
      message: "Email successfully verified",
      user,
    };
  }

  async resendVerificationOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException("User not found with this email");
    }

    if (user.isEmailVerified) {
      throw new BadRequestException("Email is already verified");
    }

    const otp = OtpUtil.generateNumericOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpToken.create({
      data: {
        email: user.email,
        code: otp,
        type: OtpType.EMAIL_VERIFICATION,
        expiresAt,
        userId: user.id,
      },
    });

    void this.mailService.sendEmailVerificationOtp(
      user.email,
      user.firstName || user.username || "User",
      otp,
    );

    return { message: "A new verification OTP has been sent to your email" };
  }
}
