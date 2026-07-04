import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const data = categorySchema.partial().parse(body);
    const category = await prisma.category.update({ where: { id }, data });
    return jsonOk(category);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const inUse = await prisma.product.count({ where: { categoryId: id } });
    if (inUse > 0) {
      throw new AppError(
        "No se puede eliminar: hay productos que usan esta categoría",
        409
      );
    }
    await prisma.category.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
