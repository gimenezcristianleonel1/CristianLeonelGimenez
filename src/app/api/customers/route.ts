import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { whatsapp: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        orders: { select: { total: true } },
        _count: { select: { orders: true } },
      },
    });

    const withStats = customers.map((c) => ({
      id: c.id,
      name: c.name,
      whatsapp: c.whatsapp,
      address: c.address,
      createdAt: c.createdAt,
      orderCount: c._count.orders,
      totalSpent: c.orders.reduce((acc, o) => acc + o.total, 0),
    }));

    return jsonOk(withStats);
  } catch (error) {
    return errorResponse(error);
  }
}
