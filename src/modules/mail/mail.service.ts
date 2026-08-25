import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";

export interface SendMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private getBaseContext() {
    return {
      appName: this.configService.get<string>("app.name", "Nest Starter Template"),
      appUrl: this.configService.get<string>("app.appUrl", "http://localhost:3000"),
      year: new Date().getFullYear(),
    };
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      const mergedContext = {
        ...this.getBaseContext(),
        ...options.context,
      };

      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: mergedContext,
      });

      this.logger.log(
        `📧 Email [${options.template}] successfully sent to ${options.to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send email [${options.template}] to ${options.to}:`,
        error,
      );
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string, loginUrl?: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      "app.frontendUrl",
      "http://localhost:5173",
    );
    return this.sendMail({
      to,
      subject: `Welcome to ${this.configService.get<string>("app.name", "Nest Starter Template")}!`,
      template: "welcome",
      context: {
        name,
        loginUrl: loginUrl || `${frontendUrl}/login`,
      },
    });
  }

  async sendEmailVerificationOtp(
    to: string,
    name: string,
    otp: string,
    expiresInMinutes = 10,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: "Verify Your Email Address",
      template: "verify-email",
      context: {
        name,
        otp,
        expiresInMinutes,
      },
    });
  }

  async sendPasswordResetOtp(
    to: string,
    name: string,
    otp: string,
    expiresInMinutes = 10,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: "Password Reset Request",
      template: "reset-password",
      context: {
        name,
        otp,
        expiresInMinutes,
      },
    });
  }

  async sendNotification(
    to: string,
    name: string,
    subject: string,
    message: string,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject,
      template: "notification",
      context: {
        name,
        subject,
        message,
      },
    });
  }
}
