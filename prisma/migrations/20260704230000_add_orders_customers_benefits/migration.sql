-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('PERCENTAGE', 'FIXED_PRICE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'PAGADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('PREPARANDO', 'DESPACHADO', 'ENTREGADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "isOnOffer",
DROP COLUMN "offerPrice";

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "orderId" INTEGER;

-- CreateTable
CREATE TABLE "benefits" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "type" "BenefitType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "shippingAddress" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'PREPARANDO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "priceAtPurchase" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "benefits_variantId_idx" ON "benefits"("variantId");

-- CreateIndex
CREATE INDEX "benefits_startDate_endDate_idx" ON "benefits"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "customers_whatsapp_key" ON "customers"("whatsapp");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_variantId_idx" ON "order_items"("variantId");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

