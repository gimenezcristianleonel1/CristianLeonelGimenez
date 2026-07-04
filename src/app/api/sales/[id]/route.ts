import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";
import { voidSale } from "@/lib/stock";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: { include: { variant: true } }, cashSession: true },
    });
    if (!sale) throw new AppError("Venta no encontrada", 404);
    return jsonOk(sale);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const sale = await voidSale(id);
    return jsonOk(sale);
  } catch (error) {
    return errorResponse(error);
  }
}
