"use client";

import { useEffect, useState } from "react";

/** Categoría de menú más visible al hacer scroll (spy por secciones) */
export function useActiveCategory(
  sectionIds: string[],
  scrollRoot?: HTMLElement | null,
): string {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");
  const idsKey = sectionIds.join("|");

  useEffect(() => {
    const ids = idsKey ? idsKey.split("|") : [];
    if (!ids.length) return;

    const ratios = new Map<string, number>();

    const pickActive = () => {
      let bestId = ids[0];
      let bestRatio = -1;

      for (const id of ids) {
        const ratio = ratios.get(id) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }

      if (bestRatio > 0) setActiveId(bestId);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id || !ids.includes(id)) continue;
          ratios.set(id, entry.intersectionRatio);
        }
        pickActive();
      },
      {
        root: scrollRoot ?? null,
        rootMargin: scrollRoot ? "-8px 0px -55% 0px" : "-88px 0px -55% 0px",
        threshold: [0, 0.05, 0.15, 0.35, 0.6, 1],
      },
    );

    const observeSections = () => {
      observer.disconnect();
      ratios.clear();
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
      pickActive();
    };

    observeSections();
    const scrollTarget = scrollRoot ?? window;
    scrollTarget.addEventListener("scroll", observeSections, { passive: true });
    window.addEventListener("resize", observeSections, { passive: true });

    const t = window.setTimeout(observeSections, 300);

    return () => {
      window.clearTimeout(t);
      observer.disconnect();
      scrollTarget.removeEventListener("scroll", observeSections);
      window.removeEventListener("resize", observeSections);
    };
  }, [idsKey, scrollRoot]);

  return sectionIds.includes(activeId) ? activeId : sectionIds[0] ?? "";
}
