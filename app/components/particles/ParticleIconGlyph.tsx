"use client";

import { BUILTIN_PARTICLE_ICON_MAP } from "@/app/lib/particle-icon-registry";
import { customSvgPublicUrl } from "@/app/lib/custom-particle-svg";
import { iconifySvgUrl, storageNameToIconifyRef } from "@/app/lib/iconify";

function IconifyImg({
  refId,
  className,
  style,
}: {
  refId: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const url = iconifySvgUrl(refId);
  if (!url) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      aria-hidden="true"
    />
  );
}

export function ParticleIconGlyph({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Builtin = BUILTIN_PARTICLE_ICON_MAP[name];
  if (Builtin) {
    return (
      <Builtin className={className} style={style} aria-hidden="true" />
    );
  }

  const ref = storageNameToIconifyRef(name);
  if (ref) {
    return <IconifyImg refId={ref} className={className} style={style} />;
  }

  const customUrl = customSvgPublicUrl(name);
  if (customUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={customUrl}
        alt=""
        className={className}
        style={style}
        loading="lazy"
        decoding="async"
        aria-hidden="true"
      />
    );
  }

  return null;
}
