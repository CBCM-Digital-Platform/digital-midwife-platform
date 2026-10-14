"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";

function AuthErrorListener({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.error === "RefreshAccessTokenError") {
      console.warn("Session refresh failed (RefreshAccessTokenError). Signing out and redirecting to /login.");
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={4 * 60}>
      <AuthErrorListener>{children}</AuthErrorListener>
    </SessionProvider>
  );
}
