import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { attributeValueSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const attributeId = request.nextUrl.searchParams.get("attributeId");
    const values = await prisma.attributeValue.findMany({
      where: attributeId ? { attributeId: Number(attributeId) } : undefined,
      orderBy: { value: "asc" },
    });
    return jsonOk(values);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = attributeValueSchema.parse(body);
    const value = await prisma.attributeValue.create({ data });
    return jsonOk(value, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
