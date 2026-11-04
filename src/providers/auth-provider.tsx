"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider, useSession, signOut } from "next-auth/react";

function AuthErrorListener({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isSigningOut = useRef(false);

  useEffect(() => {
    // If the user is ALREADY on an auth page, DO NOT sign out or redirect
    if (
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/forgot-password") ||
      pathname?.startsWith("/reset-password")
    ) {
      return;
    }

    if ((session as any)?.error === "RefreshAccessTokenError" && !isSigningOut.current) {
      isSigningOut.current = true;
      console.warn("Session refresh token expired. Signing out.");
      signOut({ callbackUrl: "/login?error=SessionExpired", redirect: true });
    }
  }, [session, pathname]);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0} refetchWhenOffline={false}>
      <AuthErrorListener>{children}</AuthErrorListener>
    </SessionProvider>
  );
}
