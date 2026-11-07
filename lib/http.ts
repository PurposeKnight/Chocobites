import { NextResponse } from "next/server";

export function apiError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = error instanceof Error ? error.message : fallback;
  const safe = /configuration is missing/.test(message) ? "Payments are not configured yet." : fallback;
  return NextResponse.json({ error: safe }, { status: 400 });
}

export function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) throw new Error("Origin check failed");
}
