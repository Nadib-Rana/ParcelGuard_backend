export class ParcelsMapperUtil {
  static formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  static mapParcelResponse(p: any) {
    return {
      id: p.trackingId,
      dbId: p.id,
      customer: p.recipientName,
      phone: p.recipientPhone,
      address: p.recipientAddress,
      district: p.district,
      area: p.area,
      product: p.productTitle,
      category: p.category,
      weight: `${p.weightKg} kg`,
      courier: p.courier,
      cod: p.codAmount,
      charge: p.deliveryCharge,
      advance: p.advancePaid,
      risk: p.riskLevel,
      status: p.status,
      date: p.dateStr || this.formatDate(p.createdAt),
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      agentName: p.riderName,
      agentPhone: p.riderPhone,
      notes: p.notes,
      timeline: p.timeline || [],
    };
  }
}
