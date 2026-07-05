import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { paymentStatusEnum, shippingStatusEnum } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const paymentStatus = paymentStatusEnum.optional().parse(searchParams.get("paymentStatus") ?? undefined);
    const shippingStatus = shippingStatusEnum.optional().parse(searchParams.get("shippingStatus") ?? undefined);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 100);

    const where = { paymentStatus, shippingStatus };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          customer: true,
          items: { include: { variant: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return jsonOk({ orders, total, page, pageSize });
  } catch (error) {
    return errorResponse(error);
  }
}
