import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { settingSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { getSettings } from "@/lib/config";

const settingListSchema = z.array(settingSchema);

// El handler GET no usa ninguna API dinámica (cookies, headers, searchParams),
// así que Next.js optimiza esta ruta como estática en el build de producción.
// Eso deja la ruta en solo GET/HEAD y rompe PUT (405): forzamos render dinámico.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    return jsonOk(settings);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = settingListSchema.parse(body);
    const results = await prisma.$transaction(
      entries.map((entry) =>
        prisma.setting.upsert({
          where: { key: entry.key },
          update: { value: entry.value },
          create: entry,
        })
      )
    );
    return jsonOk(results);
  } catch (error) {
    return errorResponse(error);
  }
}
