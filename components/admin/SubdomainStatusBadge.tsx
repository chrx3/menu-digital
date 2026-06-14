"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  refreshBusinessesStatus,
  type SubdomainStatus,
} from "@/app/actions/subdomain-status";

interface Props {
  slug: string;
  initial?: SubdomainStatus;
}

type ViewState =
  | { phase: "loading" }
  | { phase: "ok"; data: SubdomainStatus }
  | { phase: "err"; data: SubdomainStatus };

function statusInfo(s: SubdomainStatus) {
  switch (s.kind) {
    case "ok":
      return { label: `OK · ${s.http} · ${s.latencyMs}ms`, color: "emerald", icon: CheckCircle2 };
    case "redirect":
      return { label: `Redir ${s.http} → ${s.to || "?"}`, color: "blue", icon: CheckCircle2 };
    case "http_error":
      return { label: `HTTP ${s.http}`, color: "amber", icon: AlertTriangle };
    case "timeout":
      return { label: `Timeout (${s.latencyMs}ms)`, color: "amber", icon: Clock };
    case "dns_error":
      return { label: "DNS", color: "red", icon: XCircle };
    case "unreachable":
      return { label: "Sin respuesta", color: "red", icon: XCircle };
  }
}

export function SubdomainStatusBadge({ slug, initial }: Props) {
  const [state, setState] = useState<ViewState>(
    initial ? { phase: "ok", data: initial } : { phase: "loading" },
  );
  const [pending, start] = useTransition();

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    start(async () => {
      const r = await fetch("/api/internal/subdomain-check", {
        method: "POST",
        body: JSON.stringify({ slug }),
      }).catch(() => null);
      if (cancelled) return;
      if (r && r.ok) {
        const j = (await r.json()) as SubdomainStatus;
        setState({ phase: "ok", data: j });
      } else {
        setState({ phase: "err", data: { kind: "unreachable", error: "No se pudo verificar" } });
      }
    });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function refresh() {
    setState({ phase: "loading" });
    start(async () => {
      const r = await fetch("/api/internal/subdomain-check", {
        method: "POST",
        body: JSON.stringify({ slug }),
      }).catch(() => null);
      if (r && r.ok) {
        const j = (await r.json()) as SubdomainStatus;
        setState({ phase: "ok", data: j });
      } else {
        setState({ phase: "err", data: { kind: "unreachable", error: "No se pudo verificar" } });
      }
    });
  }

  if (state.phase === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        Verificando…
      </span>
    );
  }

  const info = statusInfo(state.data);
  const Icon = info.icon;
  const palette: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  };
  const tip =
    state.data.kind === "unreachable" || state.data.kind === "dns_error"
      ? state.data.error
      : info.label;

  return (
    <span className="inline-flex items-center gap-1.5" title={tip}>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${palette[info.color]}`}
      >
        <Icon className="size-3" aria-hidden="true" />
        {info.label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={refresh}
        disabled={pending}
        aria-label="Re-verificar subdominio"
        className="size-6"
      >
        <RefreshCw className={`size-3 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
      </Button>
    </span>
  );
}
