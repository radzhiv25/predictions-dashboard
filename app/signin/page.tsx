"use client";

import { BarChart3 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(30,64,175,0.15),transparent_35%)]" />
      <div className="relative w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-slate-900">
          <BarChart3 className="size-5" />
          <h1 className="text-lg font-semibold">Predictions Dashboard</h1>
        </div>
        <h2 className="text-2xl font-semibold text-slate-950">Sign in to continue</h2>
        <p className="mt-2 text-sm text-slate-600">
          Access your dashboard, place simulated trades, and track position performance.
        </p>
        <Button className="mt-6 w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
          Continue with Google
        </Button>
      </div>
    </main>
  );
}
