import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const data = supplierSchema.partial().parse(body);
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { ...data, email: data.email || undefined },
    });
    return jsonOk(supplier);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.supplier.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
