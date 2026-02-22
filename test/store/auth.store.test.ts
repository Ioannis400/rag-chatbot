import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/auth.store";

describe("auth store", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null });
  });

  it("setToken updates token", () => {
    const { setToken } = useAuthStore.getState();
    setToken("test-token");
    expect(useAuthStore.getState().token).toBe("test-token");
  });

  it("logout clears token", () => {
    useAuthStore.setState({ token: "x" });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("getToken returns token from state", () => {
    useAuthStore.setState({ token: "stored" });
    expect(useAuthStore.getState().getToken()).toBe("stored");
  });

  it("getToken returns token from localStorage when state is empty", () => {
    useAuthStore.setState({ token: null });
    (globalThis.localStorage as { setItem: (k: string, v: string) => void }).setItem(
      "token",
      "from-storage"
    );
    expect(useAuthStore.getState().getToken()).toBe("from-storage");
    expect(useAuthStore.getState().token).toBe("from-storage");
  });
});
