import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { variantUpdateSchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
        attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
        stockMovements: { orderBy: { date: "desc" }, take: 50 },
      },
    });
    if (!variant) throw new AppError("Variante no encontrada", 404);
    return jsonOk(variant);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const data = variantUpdateSchema.parse(body);
    const { attributeValueIds, ...rest } = data;

    if (rest.sku) {
      const existing = await prisma.productVariant.findFirst({ where: { sku: rest.sku, NOT: { id } } });
      if (existing) throw new AppError(`Ya existe una variante con el SKU "${rest.sku}"`, 409);
    }

    const variant = await prisma.$transaction(async (tx) => {
      if (attributeValueIds) {
        await tx.variantAttributeValue.deleteMany({ where: { variantId: id } });
        await tx.variantAttributeValue.createMany({
          data: attributeValueIds.map((attributeValueId) => ({ variantId: id, attributeValueId })),
        });
      }
      return tx.productVariant.update({
        where: { id },
        data: rest,
        include: { attributeValues: { include: { attributeValue: true } } },
      });
    });

    return jsonOk(variant);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const movementCount = await prisma.stockMovement.count({ where: { variantId: id } });
    if (movementCount > 0) {
      const variant = await prisma.productVariant.update({
        where: { id },
        data: { isActive: false },
      });
      return jsonOk({ success: true, deactivated: true, variant });
    }
    await prisma.productVariant.delete({ where: { id } });
    return jsonOk({ success: true, deactivated: false });
  } catch (error) {
    return errorResponse(error);
  }
}
