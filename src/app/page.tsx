"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Moon, Sun, Leaf } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { api } from "@/lib/api-client";
import { OfferBanner, OfferItem } from "@/components/store/OfferBanner";
import { ProductCard, StoreVariant } from "@/components/store/ProductCard";
import { CartDrawer, CartLine } from "@/components/store/CartDrawer";
import { CheckoutModal } from "@/components/store/CheckoutModal";
import { buildWhatsAppLink, buildWhatsAppOrderMessage } from "@/lib/whatsapp";

type CatalogProduct = {
  productId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  variants: StoreVariant[];
};

type Catalog = {
  businessName: string;
  tagline: string;
  currencySymbol: string;
  whatsappNumber: string;
  products: CatalogProduct[];
};

export default function StorefrontPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    api.get<Catalog>("/api/public/catalog").then(setCatalog);
  }, []);

  const currency = catalog?.currencySymbol ?? "$";

  const offers: OfferItem[] = useMemo(() => {
    if (!catalog) return [];
    const list: OfferItem[] = [];
    for (const product of catalog.products) {
      for (const variant of product.variants) {
        if (variant.isOnOffer) {
          list.push({
            variantId: variant.variantId,
            productName: product.name,
            variantName: variant.name,
            regularPrice: variant.regularPrice,
            price: variant.price,
            imageUrl: product.imageUrl,
          });
        }
      }
    }
    return list;
  }, [catalog]);

  function findVariant(variantId: number) {
    for (const product of catalog?.products ?? []) {
      const variant = product.variants.find((v) => v.variantId === variantId);
      if (variant) return { product, variant };
    }
    return null;
  }

  function addToCart(variantId: number) {
    const found = findVariant(variantId);
    if (!found) return;
    const { product, variant } = found;
    setCart((prev) => {
      const existing = prev.find((l) => l.variantId === variantId);
      if (existing) {
        if (existing.quantity + 1 > variant.stock) return prev;
        return prev.map((l) => (l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (variant.stock < 1) return prev;
      const label = variant.name && variant.name !== product.name ? `${product.name} — ${variant.name}` : product.name;
      return [...prev, { variantId, name: label, quantity: 1, unitPrice: variant.price, maxStock: variant.stock }];
    });
    setCartOpen(true);
  }

  function changeQty(variantId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(Math.max(l.quantity + delta, 0), l.maxStock) } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(variantId: number) {
    setCart((prev) => prev.filter((l) => l.variantId !== variantId));
  }

  async function handleConfirmOrder(data: {
    customerName: string;
    customerPhone: string;
    paymentMethod: string;
    notes: string;
  }) {
    const total = cart.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
    await api.post("/api/public/orders", {
      items: cart.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      paymentMethod: data.paymentMethod,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      notes: data.notes,
    });

    const message = buildWhatsAppOrderMessage(cart, total, currency, data.customerName);
    const whatsappLink = catalog?.whatsappNumber
      ? buildWhatsAppLink(catalog.whatsappNumber, message)
      : null;

    setCart([]);
    setCartOpen(false);
    const catalogData = await api.get<Catalog>("/api/public/catalog");
    setCatalog(catalogData);

    return { whatsappLink };
  }

  const cartCount = cart.reduce((acc, l) => acc + l.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Leaf size={20} />
            </div>
            <div>
              <p className="font-semibold leading-tight">{catalog?.businessName ?? "Cargando..."}</p>
              {catalog?.tagline && <p className="text-xs text-gray-500 dark:text-gray-400">{catalog.tagline}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={toggle}
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setCartOpen(true)}
              aria-label="Ver carrito"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <OfferBanner offers={offers} currency={currency} onAdd={addToCart} />

        <section>
          <h2 className="mb-3 text-lg font-semibold">Catálogo</h2>
          {!catalog ? (
            <p className="text-sm text-gray-500">Cargando productos...</p>
          ) : catalog.products.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay productos publicados.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.products.flatMap((product) =>
                product.variants.map((variant) => (
                  <ProductCard
                    key={variant.variantId}
                    productName={product.name}
                    description={product.description}
                    imageUrl={product.imageUrl}
                    variant={variant}
                    currency={currency}
                    onAdd={() => addToCart(variant.variantId)}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400 dark:border-gray-800">
        <Link href="/admin" className="hover:underline">
          Acceso administrador
        </Link>
      </footer>

      <CartDrawer
        open={cartOpen}
        lines={cart}
        currency={currency}
        onClose={() => setCartOpen(false)}
        onChangeQty={changeQty}
        onRemove={removeLine}
        onCheckout={() => setCheckoutOpen(true)}
      />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onConfirm={handleConfirmOrder} />
    </div>
  );
}
