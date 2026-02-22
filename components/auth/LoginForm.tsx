"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth.store";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        tab === "register" ? { email, password, name } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler");
        return;
      }
      setToken(data.token);
      router.push("/chat");
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader>
          <CardTitle>Willkommen</CardTitle>
          <CardDescription>
            Melde dich an oder erstelle ein neues Konto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "login" | "register");
              setError(null);
            }}
          >
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="login" className="flex-1">
                Anmelden
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                Registrieren
              </TabsTrigger>
            </TabsList>

            {(["login", "register"] as const).map((t) => (
              <TabsContent key={t} value={t}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {t === "register" && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Max Mustermann"
                        autoComplete="name"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor={`${t}-email`}>E-Mail</Label>
                    <Input
                      id={`${t}-email`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@beispiel.de"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${t}-password`}>Passwort</Label>
                    <Input
                      id={`${t}-password`}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={t === "register" ? 6 : 1}
                      placeholder="••••••••"
                      autoComplete={
                        t === "login" ? "current-password" : "new-password"
                      }
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bitte warten...
                      </>
                    ) : t === "login" ? (
                      "Anmelden"
                    ) : (
                      "Konto erstellen"
                    )}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
