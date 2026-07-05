import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { effectiveSalePrice, effectivePrice, getActiveBenefitsMap } from "@/lib/stock";
import { getSettings } from "@/lib/config";

export async function GET() {
  try {
    const [products, settings] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          variants: { where: { isActive: true, isPublished: true } },
        },
        orderBy: { name: "asc" },
      }),
      getSettings(),
    ]);

    const allVariantIds = products.flatMap((p) => p.variants.map((v) => v.id));
    const benefitsMap = await getActiveBenefitsMap(allVariantIds);

    const items = products
      .filter((p) => p.variants.length > 0)
      .map((product) => ({
        productId: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        categoryName: product.category?.name ?? null,
        variants: product.variants.map((v) => {
          const benefit = benefitsMap.get(v.id);
          return {
            variantId: v.id,
            name: v.name,
            sku: v.sku,
            stock: v.currentStock,
            regularPrice: effectivePrice(v, product),
            price: effectiveSalePrice(v, product, benefit),
            isOnOffer: Boolean(benefit),
            offerEndDate: benefit?.endDate ?? null,
          };
        }),
      }));

    return jsonOk({
      businessName: settings.business_name,
      tagline: settings.store_tagline,
      currencySymbol: settings.currency_symbol,
      whatsappNumber: settings.whatsapp_number,
      products: items,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
