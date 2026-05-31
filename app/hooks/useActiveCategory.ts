"use client";

import { useEffect, useState } from "react";

/** Categoría de menú más visible al hacer scroll (spy por secciones) */
export function useActiveCategory(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    if (sectionIds.length === 0) {
      setActiveId("");
      return;
    }

    setActiveId((prev) =>
      sectionIds.includes(prev) ? prev : sectionIds[0],
    );

    const ratios = new Map<string, number>();

    const pickActive = () => {
      let bestId = sectionIds[0];
      let bestRatio = -1;

      for (const id of sectionIds) {
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
          if (!id || !sectionIds.includes(id)) continue;
          ratios.set(id, entry.intersectionRatio);
        }
        pickActive();
      },
      {
        root: null,
        rootMargin: "-88px 0px -55% 0px",
        threshold: [0, 0.05, 0.15, 0.35, 0.6, 1],
      },
    );

    const observeSections = () => {
      observer.disconnect();
      ratios.clear();
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
      pickActive();
    };

    observeSections();
    window.addEventListener("scroll", observeSections, { passive: true });
    window.addEventListener("resize", observeSections, { passive: true });

    const t = window.setTimeout(observeSections, 300);

    return () => {
      window.clearTimeout(t);
      observer.disconnect();
      window.removeEventListener("scroll", observeSections);
      window.removeEventListener("resize", observeSections);
    };
  }, [sectionIds.join("|")]);

  return activeId;
}
