import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { FilterCustomersDto, AddCustomerNoteDto } from "./dto/customer.dto";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMerchantId(userId: string): Promise<string> {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");
    return merchant.id;
  }

  async listCustomers(userId: string, filter: FilterCustomersDto) {
    const merchantId = await this.getMerchantId(userId);
    const { search, risk } = filter;

    const where: any = { merchantId };
    if (risk && risk !== "All") {
      where.riskLevel = risk;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { lastOrderAt: "desc" },
    });

    return customers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      orders: c.ordersCount,
      delivered: c.deliveredCount,
      returned: c.returnedCount,
      rate: c.successRate,
      risk: c.riskLevel,
      last: c.lastOrderAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      isWatchlist: c.isWatchlist,
      notes: c.notes,
    }));
  }

  async toggleWatchlist(userId: string, phone: string) {
    const merchantId = await this.getMerchantId(userId);

    const customer = await this.prisma.customer.findUnique({
      where: {
        merchantId_phone: {
          merchantId,
          phone,
        },
      },
    });

    if (!customer) throw new NotFoundException("Customer not found in merchant records");

    return this.prisma.customer.update({
      where: { id: customer.id },
      data: { isWatchlist: !customer.isWatchlist },
    });
  }

  async addNote(userId: string, phone: string, dto: AddCustomerNoteDto) {
    const merchantId = await this.getMerchantId(userId);

    const customer = await this.prisma.customer.findUnique({
      where: {
        merchantId_phone: {
          merchantId,
          phone,
        },
      },
    });

    if (!customer) throw new NotFoundException("Customer not found");

    return this.prisma.customer.update({
      where: { id: customer.id },
      data: { notes: dto.notes },
    });
  }
}
