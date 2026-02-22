"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppHeader } from "@/components/shared/AppHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuthStore } from "@/store/auth.store";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const getToken = useAuthStore((s) => s.getToken);
  const isChatPage = pathname === "/chat";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    queueMicrotask(() => setReady(true));
  }, [router, getToken]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isChatPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}
