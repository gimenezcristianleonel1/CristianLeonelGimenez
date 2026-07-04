import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { attributeSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const data = attributeSchema.partial().parse(body);
    const attribute = await prisma.attribute.update({ where: { id }, data });
    return jsonOk(attribute);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.attribute.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
