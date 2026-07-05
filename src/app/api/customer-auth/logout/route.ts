import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customerAuth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
