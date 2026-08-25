import { Module } from "@nestjs/common";
import { FraudService } from "./fraud.service";
import { FraudController } from "./fraud.controller";
import { FraudEvaluatorService } from "./services/fraud-evaluator.service";
import { FraudReportingService } from "./services/fraud-reporting.service";
import { FraudCourierApiService } from "./services/fraud-courier-api.service";

@Module({
  controllers: [FraudController],
  providers: [
    FraudService,
    FraudEvaluatorService,
    FraudReportingService,
    FraudCourierApiService,
  ],
  exports: [
    FraudService,
    FraudEvaluatorService,
    FraudReportingService,
    FraudCourierApiService,
  ],
})
export class FraudModule {}
