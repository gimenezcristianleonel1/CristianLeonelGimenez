import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";
import { orderStatusUpdateSchema } from "@/lib/validations";
import { updateOrderStatus } from "@/lib/orders";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, whatsapp: true, address: true, email: true, createdAt: true } },
        items: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!order) throw new AppError("Pedido no encontrado", 404);
    return jsonOk(order);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const data = orderStatusUpdateSchema.parse(body);
    const order = await updateOrderStatus(id, data);
    return jsonOk(order);
  } catch (error) {
    return errorResponse(error);
  }
}
