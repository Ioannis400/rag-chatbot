"use client";

import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrainCircuit } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              AI Knowledge Chatbot
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Intelligente Antworten aus deinen Dokumenten
            </p>
          </div>
        </motion.div>
        <LoginForm />
      </div>
    </div>
  );
}
