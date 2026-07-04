import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fieldLabelSchema } from "@/lib/validations";
import { errorResponse, jsonOk } from "@/lib/api-utils";
import { getFieldLabels } from "@/lib/config";

// Acepta un array de { fieldKey, label } para actualizar varias etiquetas a la vez.
const labelListSchema = z.array(fieldLabelSchema);

export async function GET() {
  try {
    const labels = await getFieldLabels();
    return jsonOk(labels);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = labelListSchema.parse(body);
    const results = await prisma.$transaction(
      entries.map((entry) =>
        prisma.fieldLabel.upsert({
          where: { fieldKey: entry.fieldKey },
          update: { label: entry.label },
          create: entry,
        })
      )
    );
    return jsonOk(results);
  } catch (error) {
    return errorResponse(error);
  }
}
