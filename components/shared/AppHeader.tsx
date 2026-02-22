"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppNav } from "./AppNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BrainCircuit, Menu, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
    setMobileMenuOpen(false);
  };

  const navItems = [
    { href: "/chat", label: "Chat" },
    { href: "/rag", label: "Dokumente" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/chat" className="flex min-w-0 shrink items-center gap-2">
          <BrainCircuit className="h-6 w-6 shrink-0 text-primary" />
          <h2 className="truncate text-base font-semibold sm:text-lg">
            AI Knowledge Chatbot
          </h2>
        </Link>

        {/* Desktop: Nav + Logout */}
        <div className="hidden items-center gap-2 md:flex">
          <AppNav />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Abmelden
          </Button>
        </div>

        {/* Mobile: Hamburger Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menü öffnen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" title="Navigation" className="w-[280px]">
            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
