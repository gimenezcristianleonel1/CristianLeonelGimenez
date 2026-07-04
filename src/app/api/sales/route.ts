import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { saleSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { registerSale } from "@/lib/stock";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "50"), 200);

    const where = {
      status: status ?? undefined,
      date:
        from || to
          ? {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            }
          : undefined,
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: { include: { variant: true } } },
      }),
      prisma.sale.count({ where }),
    ]);

    return jsonOk({ sales, total, page, pageSize });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = saleSchema.parse(body);
    const sale = await registerSale(data);
    return jsonOk(sale, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
