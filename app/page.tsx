"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuthStore } from "@/store/auth.store";

export default function Home() {
  const router = useRouter();
  const getToken = useAuthStore((s) => s.getToken);

  useEffect(() => {
    const token = getToken();
    router.replace(token ? "/chat" : "/login");
  }, [router, getToken]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
