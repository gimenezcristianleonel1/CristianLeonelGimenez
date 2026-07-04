import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fixedCostSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    const costs = await prisma.fixedCost.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(costs);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = fixedCostSchema.parse(body);
    const cost = await prisma.fixedCost.create({ data });
    return jsonOk(cost, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
