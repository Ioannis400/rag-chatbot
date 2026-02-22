import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

const schema = z.object({
  email: z.email({ error: "Ungültige E-Mail-Adresse" }),
  password: z.string().min(6, { error: "Passwort muss mindestens 6 Zeichen haben" }),
  name: z.string().min(1, { error: "Name ist erforderlich" }),
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
    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    const token = signToken(user.id);
    return NextResponse.json({ token, user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
