import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "@/lib/auth";

describe("auth", () => {
  it("signToken returns a non-empty string", () => {
    const token = signToken(123);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verifyToken decodes valid token and returns userId", () => {
    const token = signToken(42);
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject({ userId: 42 });
    expect(decoded.userId).toBe(42);
  });

  it("verifyToken throws for invalid token", () => {
    expect(() => verifyToken("invalid.token.here")).toThrow();
  });
});
