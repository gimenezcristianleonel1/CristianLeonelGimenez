import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    return jsonOk(suppliers);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = supplierSchema.parse(body);
    const supplier = await prisma.supplier.create({ data: { ...data, email: data.email || null } });
    return jsonOk(supplier, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
