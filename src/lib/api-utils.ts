import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos inválidos", details: error.flatten() },
      { status: 422 }
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
