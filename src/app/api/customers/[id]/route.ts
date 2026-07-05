import { NextRequest } from "next/server";
import { errorResponse, jsonOk, AppError } from "@/lib/api-utils";
import { getCustomerWithStats } from "@/lib/orders";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    const result = await getCustomerWithStats(id);
    if (!result) throw new AppError("Cliente no encontrado", 404);
    return jsonOk(result);
  } catch (error) {
    return errorResponse(error);
  }
}
