import { Percent } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export type OfferItem = {
  variantId: number;
  productName: string;
  variantName: string;
  regularPrice: number;
  price: number;
  imageUrl: string | null;
};

export function OfferBanner({
  offers,
  currency,
  onAdd,
}: {
  offers: OfferItem[];
  currency: string;
  onAdd: (variantId: number) => void;
}) {
  if (offers.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Percent size={18} className="text-accent-500" /> Ofertas
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {offers.map((offer) => (
          <button
            key={offer.variantId}
            onClick={() => onAdd(offer.variantId)}
            className="flex min-w-[220px] flex-shrink-0 flex-col items-start gap-1 rounded-xl border border-accent-300 bg-gradient-to-br from-accent-50 to-white p-4 text-left shadow-sm transition hover:shadow-md dark:border-accent-900/50 dark:from-accent-900/10 dark:to-gray-900"
          >
            <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-white">OFERTA</span>
            <p className="mt-1 font-semibold">{offer.productName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{offer.variantName}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(offer.regularPrice, currency)}
              </span>
              <span className="text-lg font-bold text-accent-600 dark:text-accent-400">
                {formatCurrency(offer.price, currency)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
