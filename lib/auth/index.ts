import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export function signToken(userId: number): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } {
  const decoded = jwt.verify(token, SECRET) as { userId: number };
  return decoded;
}
