import * as bcrypt from "bcryptjs";

export class HashUtil {
  static async hash(plainText: string, saltRounds = 10): Promise<string> {
    return bcrypt.hash(plainText, saltRounds);
  }

  static async compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
