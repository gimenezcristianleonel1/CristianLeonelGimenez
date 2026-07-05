"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ChevronDown, ChevronRight, Pencil, Tag, Percent, Trash2 } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useLabel, useCurrency } from "@/components/providers/AppConfigProvider";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";

type Category = { id: number; name: string; description: string | null };
type AttributeValue = { id: number; value: string; attributeId: number };
type Attribute = { id: number; name: string; values: AttributeValue[] };
type BenefitType = "PERCENTAGE" | "FIXED_PRICE";
type Benefit = { id: number; type: BenefitType; value: number; startDate: string; endDate: string };
type Variant = {
  id: number;
  productId: number;
  sku: string;
  name: string;
  priceOverride: number | null;
  minStockOverride: number | null;
  currentStock: number;
  isActive: boolean;
  isPublished: boolean;
  attributeValues: { attributeValue: AttributeValue & { attribute: { name: string } } }[];
  benefits: Benefit[];
};
type Product = {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  categoryId: number | null;
  category: Category | null;
  unit: string;
  minStock: number;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
  variants: Variant[];
};

function activeBenefit(benefits: Benefit[], now = new Date()): Benefit | null {
  return (
    benefits.find((b) => new Date(b.startDate) <= now && now <= new Date(b.endDate)) ?? null
  );
}

function priceWithBenefit(regularPrice: number, benefit: Benefit | null): number {
  if (!benefit) return regularPrice;
  if (benefit.type === "PERCENTAGE") return Math.max(regularPrice * (1 - benefit.value / 100), 0);
  return Math.min(benefit.value, regularPrice);
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [productModal, setProductModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [variantModal, setVariantModal] = useState<{ open: boolean; productId: number | null; variant: Variant | null }>(
    { open: false, productId: null, variant: null }
  );
  const [categoryModal, setCategoryModal] = useState(false);

  const productLabel = useLabel("product", "Producto");
  const productPlural = useLabel("product_plural", "Productos");
  const categoryLabel = useLabel("category", "Categoría");
  const skuLabel = useLabel("sku", "SKU / Código");
  const currency = useCurrency();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, c, a] = await Promise.all([
      api.get<Product[]>("/api/products?includeInactive=true"),
      api.get<Category[]>("/api/categories"),
      api.get<Attribute[]>("/api/attributes"),
    ]);
    setProducts(p);
    setCategories(c);
    setAttributes(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{productPlural}</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setCategoryModal(true)}>
            <Tag size={16} /> {categoryLabel}
          </button>
          <button
            className="btn-primary"
            onClick={() => setProductModal({ open: true, product: null })}
          >
            <Plus size={16} /> Nuevo {productLabel.toLowerCase()}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="w-8 py-3 pl-4" />
                <th className="py-3">{productLabel}</th>
                <th className="py-3">{skuLabel}</th>
                <th className="py-3">{categoryLabel}</th>
                <th className="py-3 text-right">Precio base</th>
                <th className="py-3 text-right">Variantes</th>
                <th className="py-3 pr-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  expanded={expanded.has(product.id)}
                  onToggle={() => toggleExpand(product.id)}
                  onEditProduct={() => setProductModal({ open: true, product })}
                  onNewVariant={() => setVariantModal({ open: true, productId: product.id, variant: null })}
                  onEditVariant={(v) => setVariantModal({ open: true, productId: product.id, variant: v })}
                  currency={currency}
                />
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Todavía no hay {productPlural.toLowerCase()} cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        open={productModal.open}
        product={productModal.product}
        categories={categories}
        onClose={() => setProductModal({ open: false, product: null })}
        onSaved={loadAll}
      />
      <VariantModal
        open={variantModal.open}
        productId={variantModal.productId}
        variant={variantModal.variant}
        attributes={attributes}
        currency={currency}
        onClose={() => setVariantModal({ open: false, productId: null, variant: null })}
        onSaved={loadAll}
      />
      <CategoryModal open={categoryModal} onClose={() => setCategoryModal(false)} onSaved={loadAll} />
    </div>
  );
}

function ProductRow({
  product,
  expanded,
  onToggle,
  onEditProduct,
  onNewVariant,
  onEditVariant,
  currency,
}: {
  product: Product;
  expanded: boolean;
  onToggle: () => void;
  onEditProduct: () => void;
  onNewVariant: () => void;
  onEditVariant: (v: Variant) => void;
  currency: string;
}) {
  return (
    <>
      <tr className="border-t border-gray-100 dark:border-gray-800">
        <td className="pl-4">
          <button onClick={onToggle} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className="py-3">
          <p className={`font-medium ${!product.isActive ? "text-gray-400 line-through" : ""}`}>
            {product.name}
          </p>
          {product.description && (
            <p className="max-w-xs truncate text-xs text-gray-400">{product.description}</p>
          )}
        </td>
        <td className="py-3 text-gray-500">{product.sku}</td>
        <td className="py-3 text-gray-500">{product.category?.name ?? "—"}</td>
        <td className="py-3 text-right">{formatCurrency(product.basePrice, currency)}</td>
        <td className="py-3 text-right">{product.variants.length}</td>
        <td className="py-3 pr-4 text-right">
          <button
            onClick={onEditProduct}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Editar producto"
          >
            <Pencil size={15} />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/30">
          <td colSpan={7} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-gray-400">Variantes</p>
              <button className="btn-secondary" onClick={onNewVariant}>
                <Plus size={14} /> Nueva variante
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-1">Nombre</th>
                  <th className="pb-1">SKU</th>
                  <th className="pb-1 text-right">Stock</th>
                  <th className="pb-1 text-right">Precio</th>
                  <th className="pb-1 text-center">Oferta</th>
                  <th className="pb-1 text-center">Publicada</th>
                  <th className="pb-1 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v) => {
                  const benefit = activeBenefit(v.benefits);
                  const regular = v.priceOverride ?? product.basePrice;
                  const finalPrice = priceWithBenefit(regular, benefit);
                  return (
                    <tr key={v.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-2">
                        <p className={!v.isActive ? "text-gray-400 line-through" : ""}>{v.name}</p>
                        {v.attributeValues.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {v.attributeValues.map((av) => av.attributeValue.value).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="py-2 text-gray-500">{v.sku}</td>
                      <td className="py-2 text-right">{formatNumber(v.currentStock)}</td>
                      <td className="py-2 text-right">
                        {benefit ? (
                          <span>
                            <span className="mr-1 text-xs text-gray-400 line-through">
                              {formatCurrency(regular, currency)}
                            </span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(finalPrice, currency)}
                            </span>
                          </span>
                        ) : (
                          formatCurrency(regular, currency)
                        )}
                      </td>
                      <td className="py-2 text-center">
                        {benefit && <Percent size={14} className="mx-auto text-accent-500" />}
                      </td>
                      <td className="py-2 text-center">
                        {v.isPublished ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Sí</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => onEditVariant(v)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

function ProductModal({
  open,
  product,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => emptyProductForm(product));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const productLabel = useLabel("product", "Producto");
  const categoryLabel = useLabel("category", "Categoría");
  const skuLabel = useLabel("sku", "SKU / Código");
  const minStockLabel = useLabel("minStock", "Stock Mínimo");
  const basePriceLabel = useLabel("basePrice", "Precio de Venta");

  useEffect(() => {
    setForm(emptyProductForm(product));
    setError(null);
  }, [product, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        description: form.description || null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        unit: form.unit,
        minStock: Number(form.minStock),
        basePrice: Number(form.basePrice),
        imageUrl: form.imageUrl || null,
        isActive: form.isActive,
      };
      if (product) {
        await api.patch(`/api/products/${product.id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={product ? `Editar ${productLabel.toLowerCase()}` : `Nuevo ${productLabel.toLowerCase()}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Nombre</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{skuLabel}</label>
            <input
              className="input"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">{categoryLabel}</label>
            <select
              className="input"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Sin {categoryLabel.toLowerCase()}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">URL de imagen (tienda pública)</label>
          <input
            className="input"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Unidad</label>
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="label">{minStockLabel}</label>
            <input
              type="number"
              step="any"
              className="input"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{basePriceLabel}</label>
            <input
              type="number"
              step="any"
              className="input"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Activo
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function emptyProductForm(product: Product | null) {
  return {
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ? String(product.categoryId) : "",
    unit: product?.unit ?? "unidad",
    minStock: String(product?.minStock ?? 0),
    basePrice: String(product?.basePrice ?? 0),
    imageUrl: product?.imageUrl ?? "",
    isActive: product?.isActive ?? true,
  };
}

function VariantModal({
  open,
  productId,
  variant,
  attributes,
  currency,
  onClose,
  onSaved,
}: {
  open: boolean;
  productId: number | null;
  variant: Variant | null;
  attributes: Attribute[];
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => emptyVariantForm(variant));
  const [selectedValues, setSelectedValues] = useState<Set<number>>(
    new Set(variant?.attributeValues.map((av) => av.attributeValue.id) ?? [])
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(emptyVariantForm(variant));
    setSelectedValues(new Set(variant?.attributeValues.map((av) => av.attributeValue.id) ?? []));
    setError(null);
  }, [variant, open]);

  function toggleValue(id: number) {
    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        productId,
        sku: form.sku,
        name: form.name,
        priceOverride: form.priceOverride ? Number(form.priceOverride) : null,
        minStockOverride: form.minStockOverride ? Number(form.minStockOverride) : null,
        isActive: form.isActive,
        isPublished: form.isPublished,
        attributeValueIds: Array.from(selectedValues),
      };
      if (variant) {
        await api.patch(`/api/variants/${variant.id}`, payload);
      } else {
        await api.post("/api/variants", payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={variant ? "Editar variante" : "Nueva variante"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">SKU</label>
            <input
              className="input"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Precio (deja vacío para usar el base)</label>
            <input
              type="number"
              step="any"
              className="input"
              value={form.priceOverride}
              onChange={(e) => setForm({ ...form, priceOverride: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Stock mínimo (opcional)</label>
            <input
              type="number"
              step="any"
              className="input"
              value={form.minStockOverride}
              onChange={(e) => setForm({ ...form, minStockOverride: e.target.value })}
            />
          </div>
        </div>

        {attributes.length > 0 && (
          <div>
            <label className="label">Atributos</label>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              {attributes.map((attr) => (
                <div key={attr.id}>
                  <p className="mb-1 text-xs font-semibold text-gray-500">{attr.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((v) => (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => toggleValue(v.id)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          selectedValues.has(v.id)
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {variant ? (
          <BenefitsManager
            variantId={variant.id}
            regularPrice={form.priceOverride ? Number(form.priceOverride) : null}
            currency={currency}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-400 dark:border-gray-700">
            Guardá la variante primero para poder agregar beneficios (ofertas temporales con fecha).
          </p>
        )}

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Activa
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Publicada en tienda pública
          </label>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function emptyVariantForm(variant: Variant | null) {
  return {
    name: variant?.name ?? "",
    sku: variant?.sku ?? "",
    priceOverride: variant?.priceOverride != null ? String(variant.priceOverride) : "",
    minStockOverride: variant?.minStockOverride != null ? String(variant.minStockOverride) : "",
    isActive: variant?.isActive ?? true,
    isPublished: variant?.isPublished ?? true,
  };
}

function BenefitsManager({
  variantId,
  regularPrice,
  currency,
}: {
  variantId: number;
  regularPrice: number | null;
  currency: string;
}) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<BenefitType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<Benefit[]>(`/api/benefits?variantId=${variantId}`);
    setBenefits(data);
    setLoading(false);
  }, [variantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/benefits", {
        variantId,
        type,
        value: Number(value),
        startDate,
        endDate,
      });
      setValue("");
      setStartDate("");
      setEndDate("");
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al crear el beneficio");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await api.delete(`/api/benefits/${id}`);
    load();
  }

  const now = new Date();

  return (
    <div className="rounded-lg border border-accent-200 bg-accent-50 p-3 dark:border-accent-900/50 dark:bg-accent-900/10">
      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Percent size={14} /> Beneficios / ofertas temporales
      </p>

      {!loading && benefits.length > 0 && (
        <ul className="mb-3 space-y-1">
          {benefits.map((b) => {
            const isActive = new Date(b.startDate) <= now && now <= new Date(b.endDate);
            const preview = regularPrice != null ? priceWithBenefit(regularPrice, b) : null;
            return (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 rounded bg-white/70 px-2 py-1.5 text-xs dark:bg-gray-900/40"
              >
                <span>
                  {b.type === "PERCENTAGE" ? `${b.value}% off` : `Precio fijo ${formatCurrency(b.value, currency)}`}
                  {preview != null && (
                    <span className="text-gray-400"> → {formatCurrency(preview, currency)}</span>
                  )}
                  <br />
                  <span className="text-gray-400">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)}
                  </span>
                  {isActive && (
                    <span className="ml-1 font-semibold text-emerald-600 dark:text-emerald-400">Vigente</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={type} onChange={(e) => setType(e.target.value as BenefitType)}>
          <option value="PERCENTAGE">% de descuento</option>
          <option value="FIXED_PRICE">Precio fijo</option>
        </select>
        <input
          type="number"
          step="any"
          min="0"
          className="input"
          placeholder={type === "PERCENTAGE" ? "% ej. 15" : "Precio final"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div>
          <label className="mb-1 block text-xs text-gray-500">Desde</label>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Hasta</label>
          <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="btn-secondary mt-2 w-full"
        disabled={saving || !value || !startDate || !endDate}
      >
        <Plus size={14} /> {saving ? "Agregando..." : "Agregar beneficio"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function CategoryModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const categoryLabel = useLabel("category", "Categoría");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/categories", { name, description: description || null });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Nueva ${categoryLabel.toLowerCase()}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
