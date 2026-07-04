import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { registerPublicOrder } from "@/lib/stock";
import { paymentMethodEnum } from "@/lib/validations";

const publicOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive(),
        quantity: z.number().positive(),
      })
    )
    .min(1, "El pedido debe tener al menos un ítem"),
  paymentMethod: paymentMethodEnum,
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = publicOrderSchema.parse(body);
    const sale = await registerPublicOrder(data);
    return jsonOk(sale, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
