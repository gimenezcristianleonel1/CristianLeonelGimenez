import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/auth";
import { errorResponse, AppError } from "@/lib/api-utils";

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new AppError(
        "El servidor no tiene configurada ADMIN_PASSWORD. Definila en el archivo .env",
        500
      );
    }
    if (password !== adminPassword) {
      throw new AppError("Contraseña incorrecta", 401);
    }

    const token = await createSessionToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_MS / 1000,
      path: "/",
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
