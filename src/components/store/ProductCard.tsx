import { ImageOff, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export type StoreVariant = {
  variantId: number;
  name: string;
  sku: string;
  stock: number;
  regularPrice: number;
  price: number;
  isOnOffer: boolean;
};

export function ProductCard({
  productName,
  description,
  imageUrl,
  categoryName,
  variant,
  currency,
  onAdd,
}: {
  productName: string;
  description: string | null;
  imageUrl: string | null;
  categoryName?: string | null;
  variant: StoreVariant;
  currency: string;
  onAdd: () => void;
}) {
  const outOfStock = variant.stock <= 0;
  const label = variant.name && variant.name !== productName ? `${productName} — ${variant.name}` : productName;
  const discountPercent =
    variant.isOnOffer && variant.regularPrice > 0
      ? Math.round((1 - variant.price / variant.regularPrice) * 100)
      : 0;

  return (
    <div className="card relative flex flex-col overflow-hidden">
      {variant.isOnOffer && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          OFERTA TEMPORAL
        </span>
      )}
      <div className="flex h-40 items-center justify-center bg-gray-100 dark:bg-gray-800">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageOff size={28} className="text-gray-300 dark:text-gray-600" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {categoryName && (
          <span className="mb-1 w-fit rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            {categoryName}
          </span>
        )}
        <p className="font-semibold">{label}</p>
        {description && <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        <div className="mt-2 flex items-center gap-2">
          {variant.isOnOffer && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(variant.regularPrice, currency)}
            </span>
          )}
          <span className="text-lg font-bold text-brand-700 dark:text-brand-400">
            {formatCurrency(variant.price, currency)}
          </span>
          {discountPercent > 0 && (
            <span className="rounded bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
              -{discountPercent}%
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {outOfStock ? "Sin stock disponible" : `Stock disponible: ${variant.stock}`}
        </p>
        <button
          className="btn-primary mt-3 w-full"
          disabled={outOfStock}
          onClick={onAdd}
        >
          <Plus size={16} /> Agregar al carrito
        </button>
      </div>
    </div>
  );
}
