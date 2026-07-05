import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const categoryId = request.nextUrl.searchParams.get("categoryId");
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";

    const products = await prisma.product.findMany({
      where: {
        categoryId: categoryId ? Number(categoryId) : undefined,
        isActive: includeInactive ? undefined : true,
      },
      orderBy: { name: "asc" },
      include: {
        category: true,
        variants: {
          where: includeInactive ? undefined : { isActive: true },
          include: {
            attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
            benefits: { orderBy: { startDate: "desc" } },
          },
        },
      },
    });
    return jsonOk(products);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = productSchema.parse(body);

    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      throw new AppError(`Ya existe un producto con el SKU "${data.sku}"`, 409);
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({ data });
      // Toda familia de producto nace con una variante por defecto,
      // así los negocios simples no necesitan gestionar variantes.
      await tx.productVariant.create({
        data: {
          productId: created.id,
          sku: `${created.sku}-DEFAULT`,
          name: created.name,
        },
      });
      return tx.product.findUnique({
        where: { id: created.id },
        include: { category: true, variants: true },
      });
    });

    return jsonOk(product, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
