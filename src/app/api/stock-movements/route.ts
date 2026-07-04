import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { stockMovementSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { registerStockMovement } from "@/lib/stock";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const variantId = searchParams.get("variantId");
    const type = searchParams.get("type");
    const reason = searchParams.get("reason");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "50"), 200);

    const where = {
      variantId: variantId ? Number(variantId) : undefined,
      type: type ?? undefined,
      reason: reason ?? undefined,
      date:
        from || to
          ? {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            }
          : undefined,
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          variant: { include: { product: true } },
          supplier: true,
          sale: true,
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return jsonOk({ movements, total, page, pageSize });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = stockMovementSchema.parse(body);
    const movement = await registerStockMovement(data);
    return jsonOk(movement, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
