import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { productUpdateSchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          include: { attributeValues: { include: { attributeValue: { include: { attribute: true } } } } },
        },
      },
    });
    if (!product) throw new AppError("Producto no encontrado", 404);
    return jsonOk(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const data = productUpdateSchema.parse(body);

    if (data.sku) {
      const existing = await prisma.product.findFirst({ where: { sku: data.sku, NOT: { id } } });
      if (existing) throw new AppError(`Ya existe un producto con el SKU "${data.sku}"`, 409);
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, variants: true },
    });
    return jsonOk(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const movementCount = await prisma.stockMovement.count({
      where: { variant: { productId: id } },
    });
    if (movementCount > 0) {
      // Preservar la integridad del historial: no se elimina, se desactiva.
      const product = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      await prisma.productVariant.updateMany({
        where: { productId: id },
        data: { isActive: false },
      });
      return jsonOk({ success: true, deactivated: true, product });
    }
    await prisma.product.delete({ where: { id } });
    return jsonOk({ success: true, deactivated: false });
  } catch (error) {
    return errorResponse(error);
  }
}
