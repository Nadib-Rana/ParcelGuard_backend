import { Global, Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";
import { MailService } from "./mail.service";

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>("mail.host"),
          port: config.get<number>("mail.port"),
          secure: config.get<boolean>("mail.secure"),
          auth:
            config.get<string>("mail.user") &&
            config.get<string>("mail.password")
              ? {
                  user: config.get<string>("mail.user"),
                  pass: config.get<string>("mail.password"),
                }
              : undefined,
        },
        defaults: {
          from: `"${config.get<string>("mail.fromName")}" <${config.get<string>("mail.fromEmail")}>`,
        },
        template: {
          dir: join(process.cwd(), "templates"),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
