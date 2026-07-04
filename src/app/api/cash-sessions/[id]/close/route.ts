import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cashSessionCloseSchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const data = cashSessionCloseSchema.parse(body);

    const session = await prisma.cashSession.findUnique({
      where: { id },
      include: { sales: true, cashMovements: true },
    });
    if (!session) throw new AppError("Sesión de caja no encontrada", 404);
    if (session.status === "CERRADA") throw new AppError("La caja ya está cerrada", 409);

    const cashSales = session.sales
      .filter((s) => s.paymentMethod === "EFECTIVO" && s.status === "COMPLETADA")
      .reduce((acc, s) => acc + s.total, 0);
    const ingresos = session.cashMovements
      .filter((m) => m.type === "INGRESO")
      .reduce((acc, m) => acc + m.amount, 0);
    const egresos = session.cashMovements
      .filter((m) => m.type === "EGRESO")
      .reduce((acc, m) => acc + m.amount, 0);

    const expectedClosing = session.openingAmount + cashSales + ingresos - egresos;
    const difference = data.closingAmount - expectedClosing;

    const closed = await prisma.cashSession.update({
      where: { id },
      data: {
        status: "CERRADA",
        closedAt: new Date(),
        closingAmount: data.closingAmount,
        expectedClosing,
        difference,
        notes: data.notes,
      },
    });

    return jsonOk(closed);
  } catch (error) {
    return errorResponse(error);
  }
}
