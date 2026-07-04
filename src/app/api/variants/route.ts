import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { variantSchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId");
    const variants = await prisma.productVariant.findMany({
      where: productId ? { productId: Number(productId) } : undefined,
      orderBy: { name: "asc" },
      include: {
        product: true,
        attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
      },
    });
    return jsonOk(variants);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = variantSchema.parse(body);

    const existingSku = await prisma.productVariant.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      throw new AppError(`Ya existe una variante con el SKU "${data.sku}"`, 409);
    }

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new AppError("El producto indicado no existe", 404);

    const variant = await prisma.productVariant.create({
      data: {
        productId: data.productId,
        sku: data.sku,
        name: data.name,
        priceOverride: data.priceOverride ?? null,
        minStockOverride: data.minStockOverride ?? null,
        isActive: data.isActive,
        isOnOffer: data.isOnOffer,
        offerPrice: data.offerPrice ?? null,
        isPublished: data.isPublished,
        attributeValues: {
          create: data.attributeValueIds.map((attributeValueId) => ({ attributeValueId })),
        },
      },
      include: { attributeValues: { include: { attributeValue: true } } },
    });

    return jsonOk(variant, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
