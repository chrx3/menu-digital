"use client";

import { useCallback, useRef, useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue } from "framer-motion";
import { ShoppingCart } from "lucide-react";

const CART_TARGET_SELECTOR = "[data-cart-fly-target]";
type FlyRequest = {
  id: string;
  fromLeft: number;
  fromTop: number;
  fromWidth: number;
  fromHeight: number;
};

function getVisibleCartTarget() {
  if (typeof document === "undefined") return null;
  const targets = document.querySelectorAll<HTMLElement>(CART_TARGET_SELECTOR);
  for (const target of targets) {
    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return target;
  }
  return null;
}

function quad(t: number, a: number, b: number, c: number) {
  const u = 1 - t;
  return u * u * a + 2 * u * t * b + t * t * c;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function FlyBall({
  fly,
  onDone,
  ballSize,
  duration,
  disabled,
}: {
  fly: FlyRequest;
  onDone: (id: string) => void;
  ballSize: number;
  duration: number;
  disabled: boolean;
}) {
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const originX = fly.fromLeft + fly.fromWidth / 2 - ballSize / 2;
  const originY = fly.fromTop + fly.fromHeight / 2 - ballSize / 2;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  useEffect(() => {
    doneRef.current = false;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDoneRef.current(fly.id);
    };

    if (disabled) {
      finish();
      return;
    }
    const safety = window.setTimeout(finish, duration * 1000 + 120);

    const target = getVisibleCartTarget();
    if (!target) {
      finish();
      return () => window.clearTimeout(safety);
    }

    const targetRect = target.getBoundingClientRect();
    const sx = originX;
    const sy = originY;
    const ex = targetRect.left + targetRect.width / 2 - ballSize / 2;
    const ey = targetRect.top + targetRect.height / 2 - ballSize / 2;

    const distance = Math.hypot(ex - sx, ey - sy);
    const arcLift = Math.min(88, Math.max(36, distance * 0.42));
    const cx = (sx + ex) / 2;
    const cy = Math.min(sy, ey) - arcLift;

    x.set(0);
    y.set(0);
    scale.set(1);
    opacity.set(1);

    const controls = animate(0, 1, {
      duration,
      ease: [0.33, 0, 0.2, 1],
      onUpdate: (t) => {
        x.set(quad(t, sx, cx, ex) - sx);
        y.set(quad(t, sy, cy, ey) - sy);
        scale.set(lerp(1, 0.2, t));
        opacity.set(t < 0.88 ? 1 : lerp(1, 0, (t - 0.88) / 0.12));
      },
      onComplete: finish,
    });

    return () => {
      window.clearTimeout(safety);
      controls.stop();
    };
  }, [ballSize, disabled, duration, fly.id, opacity, originX, originY, scale, x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[200] flex items-center justify-center rounded-full bg-[#F5821F] text-white shadow-lg shadow-[#F5821F]/40 will-change-transform"
      style={{
        width: ballSize,
        height: ballSize,
        left: originX,
        top: originY,
        x,
        y,
        scale,
        opacity,
      }}
    >
      <ShoppingCart className="w-5 h-5" aria-hidden="true" />
    </motion.div>
  );
}

export function useCartFly({ duration = 0.7, ballSize = 44, disabled = false }: { duration?: number; ballSize?: number; disabled?: boolean } = {}) {
  const [flies, setFlies] = useState<FlyRequest[]>([]);
  const [cartPulse, setCartPulse] = useState(false);
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);

  const pulseCart = useCallback(() => {
    setCartPulse(true);
    window.setTimeout(() => setCartPulse(false), 480);
  }, []);

  const completeFly = useCallback(
    (id: string) => {
      setFlies((prev) => prev.filter((f) => f.id !== id));
      pulseCart();
    },
    [pulseCart],
  );

  const flyToCart = useCallback((payload: { fromRect: DOMRect }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setFlies((prev) => [
      ...prev,
      {
        id,
        fromLeft: payload.fromRect.left,
        fromTop: payload.fromRect.top,
        fromWidth: payload.fromRect.width,
        fromHeight: payload.fromRect.height,
      },
    ]);
  }, []);

  const FlyPortal = useCallback(
    () =>
      mounted
        ? createPortal(
            <>
              {flies.map((fly) => (
                <FlyBall key={fly.id} fly={fly} onDone={completeFly} ballSize={ballSize} duration={duration} disabled={disabled} />
              ))}
            </>,
            document.body,
          )
        : null,
    [ballSize, completeFly, disabled, duration, flies, mounted],
  );

  return { flyToCart, cartPulse, FlyPortal };
}
