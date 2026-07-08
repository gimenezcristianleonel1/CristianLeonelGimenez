"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Moon, Sun, Leaf, UserCircle } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { api } from "@/lib/api-client";
import { OfferBanner, OfferItem } from "@/components/store/OfferBanner";
import { ProductCard, StoreVariant } from "@/components/store/ProductCard";
import { CartDrawer, CartLine } from "@/components/store/CartDrawer";
import { CheckoutModal } from "@/components/store/CheckoutModal";
import { buildWhatsAppLink, buildWhatsAppOrderMessage } from "@/lib/whatsapp";
import { applyVolumeDiscount } from "@/lib/volumePricing";

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
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { customer } = useCustomerAuth();

  function loadCatalog() {
    setCatalogError(null);
    api
      .get<Catalog>("/api/public/catalog")
      .then(setCatalog)
      .catch(() => setCatalogError("No se pudieron cargar los productos. Probá recargar la página."));
  }

  useEffect(() => {
    loadCatalog();
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
    customerWhatsapp: string;
    customerAddress: string;
    notes: string;
  }) {
    const total = cart.reduce((acc, l) => acc + l.quantity * applyVolumeDiscount(l.unitPrice, l.quantity), 0);
    await api.post("/api/public/orders", {
      items: cart.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      customerName: data.customerName,
      customerWhatsapp: data.customerWhatsapp,
      customerAddress: data.customerAddress,
      notes: data.notes,
    });

    const message = buildWhatsAppOrderMessage(cart, total, currency, data.customerName, data.customerAddress);
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
            <Link
              href={customer ? "/mi-cuenta" : "/mi-cuenta/login"}
              className="flex items-center gap-2 rounded-lg border border-brand-600 bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <UserCircle size={18} />
              {customer ? `Hola, ${customer.name.split(" ")[0]}` : "Usuario"}
            </Link>
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
          {catalogError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400">
              <p>{catalogError}</p>
              <button className="btn-secondary mt-3" onClick={loadCatalog}>
                Reintentar
              </button>
            </div>
          ) : !catalog ? (
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
                    categoryName={product.categoryName}
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

      <footer className="border-t border-gray-200 py-4 text-center text-sm dark:border-gray-800">
        <Link
          href="/admin"
          className="font-medium text-gray-500 hover:text-brand-700 hover:underline dark:text-gray-400 dark:hover:text-brand-400"
        >
          Ingresar como administrador
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
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmOrder}
        prefill={customer ? { name: customer.name, whatsapp: customer.whatsapp, address: customer.address } : null}
      />
    </div>
  );
}
