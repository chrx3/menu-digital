"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ponytail: revalidate the server component every 30s so status badges refresh.
export function SubdomainPoller({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  const ref = useRef(intervalMs);
  ref.current = intervalMs;

  useEffect(() => {
    const id = setInterval(() => router.refresh(), ref.current);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
