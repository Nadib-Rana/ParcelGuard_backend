import { Module } from "@nestjs/common";
import { FraudService } from "./fraud.service";
import { FraudController } from "./fraud.controller";
import { FraudEvaluatorService } from "./services/fraud-evaluator.service";
import { FraudReportingService } from "./services/fraud-reporting.service";

@Module({
  controllers: [FraudController],
  providers: [FraudService, FraudEvaluatorService, FraudReportingService],
  exports: [FraudService, FraudEvaluatorService, FraudReportingService],
})
export class FraudModule {}
