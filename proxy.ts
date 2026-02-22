import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/api/chat", "/api/documents", "/api/conversations"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export function proxy(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = verifyToken(token);
    const response = NextResponse.next();
    response.headers.set("x-user-id", String(userId));
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/chat", "/api/documents/:path*", "/api/conversations/:path*"],
};
