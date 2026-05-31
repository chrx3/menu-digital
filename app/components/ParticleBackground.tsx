"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  HotdogIcon,
  FriesIcon,
  BurgerIcon,
  DrumstickIcon,
  PopcornBagIcon,
} from "./icons/FoodIcons";

type FoodIcon = typeof HotdogIcon;

interface FloatingFood {
  id: string;
  Icon: FoodIcon;
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

const ICONS: FoodIcon[] = [
  HotdogIcon,
  FriesIcon,
  BurgerIcon,
  DrumstickIcon,
  PopcornBagIcon,
];

const COLORS = [
  "text-naranja-intenso",
  "text-naranja-mc",
  "text-marron-oscuro",
  "text-marron-medio",
  "text-naranja-claro",
] as const;

/** Mezcla fija de íconos — 0 hotdog, 1 papas, 2 burger, 3 drumstick, 4 popcorn */
const ICON_MIX = [
  2, 3, 0, 4, 1, 3, 4, 2, 0, 1, 3, 4, 0, 2, 3, 1, 4, 0, 3, 2, 1, 4, 3, 0,
  2, 4, 1, 3, 0, 2, 4, 1, 3, 0, 2, 4, 1, 3, 0, 2, 4, 1, 3, 0, 2, 4,
] as const;

/** Colores mezclados independientes del ícono */
const COLOR_MIX = [
  2, 0, 4, 1, 3, 2, 0, 4, 3, 1, 0, 2, 4, 3, 1, 0, 2, 4, 1, 3, 0, 4, 2, 3,
  1, 4, 0, 2, 3, 1, 4, 0, 2, 3, 1, 4, 0, 2, 3, 1, 4, 0, 2, 3, 1, 4,
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Grilla irregular + jitter para repartir iconos por toda la pantalla */
function generateSpreadPositions(count: number, mobile: boolean): { top: number; left: number }[] {
  const cols = mobile ? 5 : 8;
  const rows = Math.ceil(count / cols);
  const positions: { top: number; left: number }[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const baseTop = (row / Math.max(rows - 1, 1)) * 94 + 3;
    const baseLeft = (col / Math.max(cols - 1, 1)) * 94 + 3;

    const jitterTop = ((i * 37 + row * 13) % 21) - 10;
    const jitterLeft = ((i * 53 + col * 19) % 23) - 11;

    const rowOffset = row % 2 === 1 ? (mobile ? 6 : 4) : 0;

    positions.push({
      top: clamp(baseTop + jitterTop, 1, 98),
      left: clamp(baseLeft + jitterLeft + rowOffset, 1, 98),
    });
  }

  return positions;
}

function buildParticles(mobile: boolean): FloatingFood[] {
  const count = mobile ? 22 : 42;
  const positions = generateSpreadPositions(count, mobile);

  return positions.map((pos, index) => {
    const layer = index % 3;
    const isSharp = layer === 0;
    const iconIndex = ICON_MIX[index % ICON_MIX.length] % ICONS.length;

    return {
      id: `food-${index}`,
      Icon: ICONS[iconIndex],
      top: `${pos.top}%`,
      left: `${pos.left}%`,
      color: COLORS[COLOR_MIX[index % COLOR_MIX.length] % COLORS.length],
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
  const { Icon } = particle;
  const minOpacity = particle.opacity * 0.82;

  return (
    <motion.div
      className={`absolute pointer-events-none will-change-transform ${particle.color}`}
      style={{
        top: particle.top,
        left: particle.left,
        width: particle.size,
        height: particle.size,
        filter: particle.blur > 0 ? `blur(${particle.blur}px)` : undefined,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={
        reducedMotion
          ? { opacity: particle.opacity, scale: 1 }
          : {
              opacity: [minOpacity, particle.opacity, minOpacity],
              y: [0, particle.driftY, 0],
              x: [0, particle.driftX, 0],
              rotate: [0, particle.rotate, 0],
              scale: [1, 1.08, 1],
            }
      }
      transition={
        reducedMotion
          ? { duration: 0.4 }
          : {
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
      aria-hidden="true"
    >
      <Icon
        className="h-full w-full"
        style={{
          filter: "drop-shadow(0 1px 3px rgba(61, 31, 0, 0.25))",
        }}
      />
    </motion.div>
  );
}

export default function ParticleBackground() {
  const reducedMotion = useReducedMotion();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const particles = useMemo(() => buildParticles(mobile), [mobile]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-naranja-mc/25 blur-[100px]" />
      <div className="absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-naranja-claro/20 blur-[90px]" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-marron-medio/18 blur-[80px]" />
      <div className="absolute top-2/3 right-1/3 h-56 w-56 rounded-full bg-naranja-intenso/15 blur-[70px]" />

      {particles.map((particle) => (
        <FloatingFoodIcon
          key={particle.id}
          particle={particle}
          reducedMotion={reducedMotion ?? false}
        />
      ))}
    </div>
  );
}
