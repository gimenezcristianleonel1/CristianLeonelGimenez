import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { effectiveMinStock } from "@/lib/stock";

export async function GET() {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: true },
    });

    const lowStock = variants
      .map((variant) => ({
        variantId: variant.id,
        variantName: variant.name,
        sku: variant.sku,
        productName: variant.product.name,
        currentStock: variant.currentStock,
        minStock: effectiveMinStock(variant, variant.product),
      }))
      .filter((v) => v.currentStock <= v.minStock)
      .sort((a, b) => a.currentStock - b.currentStock);

    return jsonOk(lowStock);
  } catch (error) {
    return errorResponse(error);
  }
}
