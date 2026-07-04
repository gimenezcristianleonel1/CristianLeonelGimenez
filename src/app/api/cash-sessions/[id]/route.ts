import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const session = await prisma.cashSession.findUnique({
      where: { id },
      include: {
        cashMovements: { orderBy: { date: "desc" } },
        sales: { include: { items: true } },
      },
    });
    if (!session) throw new AppError("Sesión de caja no encontrada", 404);
    return jsonOk(session);
  } catch (error) {
    return errorResponse(error);
  }
}
