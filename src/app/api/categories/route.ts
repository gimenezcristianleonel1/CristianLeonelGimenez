import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return jsonOk(categories);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = categorySchema.parse(body);
    const category = await prisma.category.create({ data });
    return jsonOk(category, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
