import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { attributeSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const attributes = await prisma.attribute.findMany({
      orderBy: { name: "asc" },
      include: { values: true },
    });
    return jsonOk(attributes);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = attributeSchema.parse(body);
    const attribute = await prisma.attribute.create({ data });
    return jsonOk(attribute, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
