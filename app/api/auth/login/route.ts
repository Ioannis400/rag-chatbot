import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

const schema = z.object({
  email: z.email({ error: "Ungültige E-Mail-Adresse" }),
  password: z.string().min(1, { error: "Passwort ist erforderlich" }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const message = first?.message ?? "Ungültige Eingabe";
      return NextResponse.json(
        { error: message, details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken(user.id);
    return NextResponse.json({ token, user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
