import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cashSessionOpenSchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const sessions = await prisma.cashSession.findMany({
      where: status ? { status } : undefined,
      orderBy: { openedAt: "desc" },
      include: { _count: { select: { sales: true, cashMovements: true } } },
    });
    return jsonOk(sessions);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = cashSessionOpenSchema.parse(body);

    const openSession = await prisma.cashSession.findFirst({ where: { status: "ABIERTA" } });
    if (openSession) {
      throw new AppError("Ya existe una caja abierta. Ciérrala antes de abrir una nueva.", 409);
    }

    const session = await prisma.cashSession.create({ data });
    return jsonOk(session, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
