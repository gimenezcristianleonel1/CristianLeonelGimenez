-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "field_labels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "attributes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "attribute_values" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "attributeId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "attribute_values_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "attributes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER,
    "unit" TEXT NOT NULL DEFAULT 'unidad',
    "minStock" REAL NOT NULL DEFAULT 0,
    "basePrice" REAL NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceOverride" REAL,
    "minStockOverride" REAL,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOnOffer" BOOLEAN NOT NULL DEFAULT false,
    "offerPrice" REAL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "variant_attribute_values" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "variantId" INTEGER NOT NULL,
    "attributeValueId" INTEGER NOT NULL,
    CONSTRAINT "variant_attribute_values_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "variant_attribute_values_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "attribute_values" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "variantId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL,
    "extraCost" REAL NOT NULL DEFAULT 0,
    "lot" TEXT,
    "supplierId" INTEGER,
    "saleId" INTEGER,
    "notes" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_batch_costs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "variantId" INTEGER NOT NULL,
    "lot" TEXT,
    "concept" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_batch_costs_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fixed_costs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MENSUAL',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETADA',
    "cashSessionId" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "cash_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "openingAmount" REAL NOT NULL DEFAULT 0,
    "closingAmount" REAL,
    "expectedClosing" REAL,
    "difference" REAL,
    "status" TEXT NOT NULL DEFAULT 'ABIERTA',
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cashSessionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cash_movements_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "cash_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "field_labels_fieldKey_key" ON "field_labels"("fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_name_key" ON "attributes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_values_attributeId_value_key" ON "attribute_values"("attributeId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "variant_attribute_values_variantId_attributeValueId_key" ON "variant_attribute_values"("variantId", "attributeValueId");

-- CreateIndex
CREATE INDEX "stock_movements_variantId_idx" ON "stock_movements"("variantId");

-- CreateIndex
CREATE INDEX "stock_movements_date_idx" ON "stock_movements"("date");

-- CreateIndex
CREATE INDEX "sales_date_idx" ON "sales"("date");

-- CreateIndex
CREATE INDEX "sales_cashSessionId_idx" ON "sales"("cashSessionId");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_variantId_idx" ON "sale_items"("variantId");

-- CreateIndex
CREATE INDEX "cash_movements_cashSessionId_idx" ON "cash_movements"("cashSessionId");
