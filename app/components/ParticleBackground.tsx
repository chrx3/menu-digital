"use client";

import { useEffect, useMemo, useState } from "react";
import { ParticleIconGlyph } from "@/app/components/particles/ParticleIconGlyph";
import { BUILTIN_PARTICLE_ICON_NAMES } from "@/app/lib/particle-icon-registry";
import { isValidParticleIconName } from "@/app/lib/particle-icons";

interface FloatingFood {
  id: string;
  iconName: string;
  size: number;
  top: string;
  left: string;
  color: string;
  opacity: number;
  blur: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  rotate: number;
}

const ALL_ICON_NAMES = BUILTIN_PARTICLE_ICON_NAMES;

const COLORS = [
  "text-naranja-intenso",
  "text-naranja-mc",
  "text-marron-oscuro",
  "text-marron-medio",
  "text-naranja-claro",
] as const;

function seededShuffle(arr: number[], seed: number): number[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = (((seed * (i + 1) * 31) % (i + 1)) + (i + 1)) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function resolveActiveIconNames(activeIcons: string[]): string[] {
  const valid = activeIcons.filter(isValidParticleIconName);
  return valid.length > 0 ? valid : ALL_ICON_NAMES;
}

function generateIconMix(activeIcons: string[], count: number): number[] {
  const names = resolveActiveIconNames(activeIcons);
  const mix: number[] = [];
  for (let i = 0; i < count; i++) {
    mix.push(i % names.length);
  }
  return seededShuffle(mix, 42);
}

function generateColorMix(count: number): number[] {
  const base = [
    2, 0, 4, 1, 3, 2, 0, 4, 3, 1, 0, 2, 4, 3, 1, 0, 2, 4, 1, 3, 0, 4, 2, 3, 1,
    4, 0, 2, 3, 1, 4, 0, 2, 3, 1, 4, 0, 2, 3, 1, 4, 0, 2, 3, 1, 4,
  ];
  const mix: number[] = [];
  for (let i = 0; i < count; i++) {
    mix.push(base[i % base.length] % COLORS.length);
  }
  return mix;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function generateSpreadPositions(
  count: number,
  mobile: boolean,
  preview = false,
): { top: number; left: number }[] {
  const cols = mobile ? (preview ? 3 : 4) : preview ? 4 : 6;
  const positions: { top: number; left: number }[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // En preview el panel es alto pero hay pocas partículas; repartir cada
    // ícono a lo largo de todo el alto evita huecos enormes en el centro.
    const baseTop = preview
      ? count <= 1
        ? 50
        : (i / (count - 1)) * 86 + 7
      : (row / Math.max(Math.ceil(count / cols) - 1, 1)) * 94 + 3;

    const baseLeft = (col / Math.max(cols - 1, 1)) * 86 + 7;

    const jitterTop = ((i * 37 + row * 13) % 21) - 10;
    const jitterLeft = ((i * 53 + col * 19) % 23) - 11;

    const rowOffset =
      !preview && row % 2 === 1 ? (mobile ? 6 : 4) : 0;

    positions.push({
      top: clamp(baseTop + jitterTop, 1, 98),
      left: clamp(baseLeft + jitterLeft + rowOffset, 1, 98),
    });
  }

  return positions;
}

function buildParticles(
  mobile: boolean,
  activeIcons: string[],
  desktopCount = 20,
  mobileCount = 12,
  preview = false,
): FloatingFood[] {
  const count = mobile ? mobileCount : desktopCount;
  const iconNames = resolveActiveIconNames(activeIcons);
  const iconMix = generateIconMix(activeIcons, count);
  const colorMix = generateColorMix(count);
  const positions = generateSpreadPositions(count, mobile, preview);

  if (iconNames.length === 0 || iconMix.length === 0) return [];

  return positions.map((pos, index) => {
    const layer = index % 3;
    const isSharp = layer === 0;
    const iconIndex = iconMix[index % iconMix.length] % iconNames.length;

    return {
      id: `food-${index}`,
      iconName: iconNames[iconIndex],
      top: `${pos.top}%`,
      left: `${pos.left}%`,
      color: COLORS[colorMix[index] % COLORS.length],
      opacity: isSharp ? 0.38 + (index % 3) * 0.06 : 0.28 + (index % 4) * 0.05,
      blur: isSharp ? 0 : layer === 1 ? 0.5 : 1,
      size: mobile
        ? 34 + (index % 6) * 9
        : isSharp
          ? 48 + (index % 5) * 12
          : 40 + (index % 6) * 10,
      duration: 11 + (index % 7) * 2,
      delay: (index * 0.27) % 5,
      driftX: (index % 2 === 0 ? 1 : -1) * (mobile ? 16 : 26),
      driftY: (index % 3 === 0 ? 1 : -1) * (mobile ? 22 : 34),
      rotate: (index % 2 === 0 ? 1 : -1) * (12 + (index % 6) * 6),
    };
  });
}

function FloatingFoodIcon({
  particle,
  reducedMotion,
}: {
  particle: FloatingFood;
  reducedMotion: boolean;
}) {
  const { duration, delay, opacity } = particle;
  const minOpacity = opacity * 0.82;
  const animating = !reducedMotion;

  const style: React.CSSProperties = {
    top: particle.top,
    left: particle.left,
    width: particle.size,
    height: particle.size,
    opacity: reducedMotion ? opacity : minOpacity,
    filter: particle.blur > 0 ? `blur(${particle.blur}px)` : undefined,
    willChange: animating ? "transform, opacity" : undefined,
    animation: animating
      ? `float-${particle.id} ${duration}s ease-in-out ${delay}s infinite`
      : undefined,
  };

  return (
    <div
      className={`absolute pointer-events-none ${particle.color}`}
      style={style}
      aria-hidden="true"
    >
      <ParticleIconGlyph
        className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
        name={particle.iconName}
        style={{
          filter: "drop-shadow(0 1px 3px rgba(61, 31, 0, 0.25))",
        }}
      />
    </div>
  );
}

const PREVIEW_PARTICLE_CAP = 10;

export default function ParticleBackground({
  desktopCount = 20,
  mobileCount = 12,
  disabled = false,
  icons = ALL_ICON_NAMES,
  fixed = true,
  forceMobile,
  preview = false,
}: {
  desktopCount?: number;
  mobileCount?: number;
  disabled?: boolean;
  icons?: string[];
  fixed?: boolean;
  /** Si se define, ignora el media query del viewport real (útil en previews). */
  forceMobile?: boolean;
  /** Modo preview admin: menos partículas, animación siempre activa. */
  preview?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [viewportMobile, setViewportMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const mobile = forceMobile ?? viewportMobile;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setPrefersReducedMotion(motionMedia.matches);
    updateMotion();
    motionMedia.addEventListener("change", updateMotion);
    return () => {
      cancelAnimationFrame(raf);
      motionMedia.removeEventListener("change", updateMotion);
    };
  }, []);

  useEffect(() => {
    if (forceMobile !== undefined) return;
    const media = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setViewportMobile(media.matches);
    updateMobile();
    media.addEventListener("change", updateMobile);
    return () => media.removeEventListener("change", updateMobile);
  }, [forceMobile]);

  const activeIcons = icons.length > 0 ? icons : ALL_ICON_NAMES;
  const reducedMotion = disabled || (!preview && prefersReducedMotion);

  const effectiveDesktop = preview
    ? Math.min(desktopCount, PREVIEW_PARTICLE_CAP)
    : desktopCount;
  const effectiveMobile = preview
    ? Math.min(mobileCount, Math.ceil(PREVIEW_PARTICLE_CAP * 0.6))
    : mobileCount;

  const particles = useMemo(() => {
    const built = buildParticles(
      mobile,
      activeIcons,
      effectiveDesktop,
      effectiveMobile,
      preview,
    );
    if (!preview) return built;
    return built.map((p) => ({
      ...p,
      driftX: Math.round(p.driftX * 1.4),
      driftY: Math.round(p.driftY * 1.4),
      duration: Math.max(8, p.duration - 2),
    }));
  }, [mobile, activeIcons, effectiveDesktop, effectiveMobile, preview]);

  const consolidatedKeyframes = useMemo(() => {
    if (reducedMotion) return "";
    return particles
      .map((p) => {
        const minOpacity = p.opacity * 0.82;
        return `@keyframes float-${p.id}{0%,100%{transform:translate3d(0,0,0) rotate(0deg) scale(1);opacity:${minOpacity}}50%{transform:translate3d(${p.driftX}px,${p.driftY}px,0) rotate(${p.rotate}deg) scale(1.08);opacity:${p.opacity}}}`;
      })
      .join("");
  }, [particles, reducedMotion]);

  if (!mounted) return null;

  return (
    <div
      className={`${fixed ? "fixed" : "absolute"} inset-0 pointer-events-none z-0 overflow-hidden`}
      aria-hidden="true"
    >
      {consolidatedKeyframes && <style>{consolidatedKeyframes}</style>}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-naranja-mc/25 blur-[100px]" />
      <div className="absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-naranja-claro/20 blur-[90px]" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-marron-medio/18 blur-[80px]" />
      <div className="absolute top-2/3 right-1/3 h-56 w-56 rounded-full bg-naranja-intenso/15 blur-[70px]" />

      {particles.map((particle) => (
        <FloatingFoodIcon
          key={particle.id}
          particle={particle}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}
