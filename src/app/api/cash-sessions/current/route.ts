import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await prisma.cashSession.findFirst({
      where: { status: "ABIERTA" },
      include: { cashMovements: { orderBy: { date: "desc" } }, sales: true },
    });
    return jsonOk(session);
  } catch (error) {
    return errorResponse(error);
  }
}
