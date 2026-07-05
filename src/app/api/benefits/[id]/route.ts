import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk } from "@/lib/api-utils";

type Params = { params: { id: string } };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    await prisma.benefit.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
