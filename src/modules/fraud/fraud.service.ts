import { Injectable } from "@nestjs/common";
import { CheckPhoneRiskDto, BatchScanRiskDto, ReportFraudDto } from "./dto/fraud.dto";
import { FraudEvaluatorService } from "./services/fraud-evaluator.service";
import { FraudReportingService } from "./services/fraud-reporting.service";
import { FraudEvaluationResult } from "./interfaces/fraud-evaluation.interface";

export { FraudEvaluationResult };

@Injectable()
export class FraudService {
  constructor(
    private readonly evaluator: FraudEvaluatorService,
    private readonly reporting: FraudReportingService,
  ) {}

  normalizePhone(phone: string): string {
    return this.evaluator.normalizePhone(phone);
  }

  async evaluatePhoneRisk(
    dto: CheckPhoneRiskDto,
    merchantId?: string,
  ): Promise<FraudEvaluationResult> {
    return this.evaluator.evaluate(dto, merchantId);
  }

  async batchScan(dto: BatchScanRiskDto, merchantId?: string): Promise<FraudEvaluationResult[]> {
    const results: FraudEvaluationResult[] = [];
    for (const phone of dto.phones) {
      if (!phone.trim()) continue;
      const res = await this.evaluatePhoneRisk({ phone: phone.trim() }, merchantId);
      results.push(res);
    }
    return results;
  }

  async reportFraud(dto: ReportFraudDto, merchantId?: string) {
    const cleanPhone = this.evaluator.normalizePhone(dto.phone);
    return this.reporting.reportFraud(dto, cleanPhone, merchantId);
  }

  async getRecentChecks(merchantId?: string) {
    return this.reporting.getRecentChecks(merchantId);
  }
}
