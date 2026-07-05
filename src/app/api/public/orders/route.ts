import { NextRequest } from "next/server";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { registerPublicOrder } from "@/lib/orders";
import { publicOrderSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = publicOrderSchema.parse(body);
    const order = await registerPublicOrder(data);
    return jsonOk(order, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
