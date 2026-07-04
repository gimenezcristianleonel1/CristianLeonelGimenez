import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { batchCostSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const variantId = request.nextUrl.searchParams.get("variantId");
    const costs = await prisma.productionBatchCost.findMany({
      where: variantId ? { variantId: Number(variantId) } : undefined,
      orderBy: { date: "desc" },
      include: { variant: true },
    });
    return jsonOk(costs);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = batchCostSchema.parse(body);
    const cost = await prisma.productionBatchCost.create({ data });
    return jsonOk(cost, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
