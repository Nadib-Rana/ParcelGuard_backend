import * as crypto from "crypto";

export class OtpUtil {
  /**
   * Generates a secure numeric OTP of the specified length (default 6 digits)
   */
  static generateNumericOtp(length = 6): string {
    const digits = "0123456789";
    let otp = "";
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      otp += digits[randomBytes[i] % 10];
    }

    return otp;
  }

  /**
   * Generates a secure random hex token
   */
  static generateRandomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString("hex");
  }
}
