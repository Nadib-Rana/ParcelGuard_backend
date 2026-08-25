import appConfig from "./app.config";
import databaseConfig from "./database.config";
import jwtConfig from "./jwt.config";
import mailConfig from "./mail.config";
import storageConfig from "./storage.config";
import swaggerConfig from "./swagger.config";
import throttlerConfig from "./throttler.config";

export const configurations = [
  appConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  storageConfig,
  swaggerConfig,
  throttlerConfig,
];

export {
  appConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  storageConfig,
  swaggerConfig,
  throttlerConfig,
};
