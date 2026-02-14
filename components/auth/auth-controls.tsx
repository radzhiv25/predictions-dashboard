"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

interface AuthControlsProps {
  bypassAuth?: boolean;
}

export function AuthControls({ bypassAuth = false }: AuthControlsProps) {
  const { data: session } = useSession();

  if (bypassAuth) {
    return (
      <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
        Auth bypass enabled
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Button onClick={() => signIn("google")}>
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User avatar"}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {(session.user.name ?? "U").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="max-w-44 truncate text-sm font-medium">{session.user.name ?? session.user.email}</div>
      </div>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/signin" })}>
        <LogOut />
        Sign out
      </Button>
    </div>
  );
}
