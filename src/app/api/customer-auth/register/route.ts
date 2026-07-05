import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerRegisterSchema } from "@/lib/validations";
import { errorResponse, AppError } from "@/lib/api-utils";
import { hashPassword } from "@/lib/password";
import { createCustomerSessionToken, CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_TTL_MS } from "@/lib/customerAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = customerRegisterSchema.parse(body);

    const existingByEmail = await prisma.customer.findUnique({ where: { email: data.email } });
    if (existingByEmail) {
      throw new AppError("Ya existe una cuenta con ese email. Iniciá sesión.", 409);
    }

    const existingByWhatsapp = await prisma.customer.findUnique({ where: { whatsapp: data.whatsapp } });
    if (existingByWhatsapp?.passwordHash) {
      throw new AppError("Ese WhatsApp ya tiene una cuenta registrada. Iniciá sesión.", 409);
    }

    const passwordHash = await hashPassword(data.password);

    // Si ya existía como cliente "invitado" (compró sin cuenta con ese WhatsApp),
    // la cuenta nueva hereda ese historial de pedidos en lugar de duplicarlo.
    const customer = existingByWhatsapp
      ? await prisma.customer.update({
          where: { id: existingByWhatsapp.id },
          data: { name: data.name, email: data.email, passwordHash, address: data.address ?? existingByWhatsapp.address },
        })
      : await prisma.customer.create({
          data: {
            name: data.name,
            whatsapp: data.whatsapp,
            email: data.email,
            passwordHash,
            address: data.address ?? null,
          },
        });

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
