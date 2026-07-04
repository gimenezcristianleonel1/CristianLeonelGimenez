import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { settingSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { getSettings } from "@/lib/config";

const settingListSchema = z.array(settingSchema);

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
