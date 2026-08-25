import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET || "default_super_secret_jwt_key_change_in_production_12345",
  expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "default_super_secret_jwt_refresh_key_change_in_production_12345",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
}));
