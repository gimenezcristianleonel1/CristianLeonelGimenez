import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { benefitSchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const variantId = request.nextUrl.searchParams.get("variantId");
    const benefits = await prisma.benefit.findMany({
      where: variantId ? { variantId: Number(variantId) } : undefined,
      orderBy: { startDate: "desc" },
      include: { variant: { include: { product: true } } },
    });
    return jsonOk(benefits);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = benefitSchema.parse(body);

    const variant = await prisma.productVariant.findUnique({ where: { id: data.variantId } });
    if (!variant) throw new AppError("La variante indicada no existe", 404);

    const benefit = await prisma.benefit.create({ data });
    return jsonOk(benefit, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
