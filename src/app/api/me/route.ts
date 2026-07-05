import { NextRequest } from "next/server";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";
import { customerProfileUpdateSchema } from "@/lib/validations";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSessionToken } from "@/lib/customerAuth";
import { getCustomerWithStats } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

async function requireCustomerId(request: NextRequest): Promise<number> {
  const customerId = await verifyCustomerSessionToken(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value);
  if (!customerId) throw new AppError("No autorizado", 401);
  return customerId;
}

export async function GET(request: NextRequest) {
  try {
    const customerId = await requireCustomerId(request);
    const result = await getCustomerWithStats(customerId);
    if (!result) throw new AppError("Cliente no encontrado", 404);
    return jsonOk(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const customerId = await requireCustomerId(request);
    const body = await request.json();
    const data = customerProfileUpdateSchema.parse(body);
    const customer = await prisma.customer.update({ where: { id: customerId }, data });
    const { passwordHash: _passwordHash, ...rest } = customer;
    return jsonOk(rest);
  } catch (error) {
    return errorResponse(error);
  }
}
