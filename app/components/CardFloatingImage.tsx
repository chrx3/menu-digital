"use client";

import Image from "next/image";

interface CardFloatingImageProps {
  src: string;
  alt: string;
}

function blendClassForSrc(src: string) {
  return src.includes("Photoroom")
    ? "section-food-img--dark-bg"
    : "section-food-img--light-bg";
}

/** Imagen del plato flotando arriba-derecha dentro de la card (recortada por overflow-hidden) */
export default function CardFloatingImage({ src, alt }: CardFloatingImageProps) {
  const blendClass = blendClassForSrc(src);

  return (
    <div
      className="absolute top-0 right-0 z-20 pointer-events-none
        w-[8.25rem] h-[8.25rem] sm:w-36 sm:h-36 lg:w-40 lg:h-40
        translate-x-[18%] -translate-y-[12%]"
      aria-hidden={alt === ""}
    >
      <div
        className="relative w-full h-full"
        style={{
          filter:
            "drop-shadow(0 16px 22px rgba(61, 31, 0, 0.16)) drop-shadow(0 5px 10px rgba(245, 130, 31, 0.1))",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          className={`object-contain object-right-top ${blendClass}`}
          sizes="(max-width: 640px) 132px, 160px"
        />
      </div>
    </div>
  );
}
