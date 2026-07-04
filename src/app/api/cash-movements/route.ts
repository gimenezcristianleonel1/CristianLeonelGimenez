import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cashMovementSchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const cashSessionId = request.nextUrl.searchParams.get("cashSessionId");
    const movements = await prisma.cashMovement.findMany({
      where: cashSessionId ? { cashSessionId: Number(cashSessionId) } : undefined,
      orderBy: { date: "desc" },
    });
    return jsonOk(movements);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = cashMovementSchema.parse(body);

    const session = await prisma.cashSession.findUnique({ where: { id: data.cashSessionId } });
    if (!session || session.status !== "ABIERTA") {
      throw new AppError("No hay una caja abierta válida para este movimiento", 409);
    }

    const movement = await prisma.cashMovement.create({ data });
    return jsonOk(movement, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
