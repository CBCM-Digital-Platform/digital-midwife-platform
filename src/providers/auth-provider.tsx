"use client";

import React, { useEffect, useRef } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";

function AuthErrorListener({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isSigningOut = useRef(false);

  useEffect(() => {
    if ((session as any)?.error === "RefreshAccessTokenError" && !isSigningOut.current) {
      isSigningOut.current = true;
      console.warn("Session refresh token expired. Redirecting to /login.");
      signOut({ callbackUrl: "/login", redirect: true });
    }
  }, [session]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={10 * 60}>
      <AuthErrorListener>{children}</AuthErrorListener>
    </SessionProvider>
  );
}
