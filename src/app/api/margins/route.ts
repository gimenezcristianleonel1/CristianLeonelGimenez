import { errorResponse, jsonOk } from "@/lib/api-utils";
import { computeMarginsForAllVariants } from "@/lib/stock";

export async function GET() {
  try {
    const margins = await computeMarginsForAllVariants();
    return jsonOk(margins);
  } catch (error) {
    return errorResponse(error);
  }
}
