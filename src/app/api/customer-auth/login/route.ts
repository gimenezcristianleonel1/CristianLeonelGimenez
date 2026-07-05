import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerLoginSchema } from "@/lib/validations";
import { errorResponse, AppError } from "@/lib/api-utils";
import { verifyPassword } from "@/lib/password";
import { createCustomerSessionToken, CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_TTL_MS } from "@/lib/customerAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = customerLoginSchema.parse(body);

    const customer = await prisma.customer.findUnique({ where: { email: data.email } });
    if (!customer || !customer.passwordHash) {
      throw new AppError("Email o contraseña incorrectos", 401);
    }

    const valid = await verifyPassword(data.password, customer.passwordHash);
    if (!valid) {
      throw new AppError("Email o contraseña incorrectos", 401);
    }

    const token = await createCustomerSessionToken(customer.id);
    const response = NextResponse.json({
      id: customer.id,
      name: customer.name,
      whatsapp: customer.whatsapp,
      email: customer.email,
      address: customer.address,
    });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: CUSTOMER_SESSION_TTL_MS / 1000,
      path: "/",
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
