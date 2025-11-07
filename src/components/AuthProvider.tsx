"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Public routes that don't require authentication
    const publicPaths = ["/admin/login"];

    if (publicPaths.includes(pathname)) {
      return;
    }

    // Check authentication
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push(`/admin/login?redirect=${pathname}`);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push(`/admin/login?redirect=${pathname}`);
      }
    }

    checkAuth();
  }, [pathname, router]);

  return <>{children}</>;
}
