"use client";

import { useCallback, useEffect } from "react";
import { useEditor } from "./EditorContext";

export function DevicePreview({ children }: { children: React.ReactNode }) {
  const { deviceMode, setScrollContainer } = useEditor();

  const desktopScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      setScrollContainer(deviceMode === "desktop" ? node : null);
    },
    [deviceMode, setScrollContainer],
  );

  useEffect(() => {
    if (deviceMode !== "desktop") setScrollContainer(null);
  }, [deviceMode, setScrollContainer]);

  useEffect(() => {
    return () => setScrollContainer(null);
  }, [setScrollContainer]);

  if (deviceMode === "desktop") {
    return (
      <div
        ref={desktopScrollRef}
        className="h-full w-full overflow-auto overscroll-contain bg-[#f5f5f5]"
      >
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-full items-start justify-center overflow-auto overscroll-contain p-2">
      {/* Phone frame — scales to fit available height */}
      <div
        className="relative flex shrink-0 flex-col bg-white shadow-[0_0_0_2.5px_#222,0_30px_60px_30px_rgba(0,0,0,0.25)]"
        style={{
          width: 375,
          maxWidth: "100%",
          maxHeight: "calc(100% - 8px)",
          aspectRatio: "375 / 812",
          borderRadius: 50,
        }}
      >
        {/* Screen area fills remaining space inside frame */}
        <div
          className="absolute inset-0 overflow-hidden bg-[#f5f5f5]"
          style={{
            margin: 8,
            borderRadius: 42,
          }}
        >
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-0 z-40 h-[26px] w-[120px] -translate-x-1/2 rounded-b-3xl bg-black" />

          {/* Status bar */}
          <div className="relative z-30 flex h-10 items-center justify-between bg-black/5 px-6 text-[11px] font-semibold text-black/60">
            <span>9:41</span>
            <svg width="16" height="12" viewBox="0 0 16 12">
              <rect
                x="0.5"
                y="2.5"
                width="12"
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <rect
                x="13"
                y="4.5"
                width="2"
                height="3"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="2"
                y="4"
                width="2"
                height="4"
                rx="0.3"
                fill="currentColor"
                opacity="0.4"
              />
              <rect
                x="4.5"
                y="4"
                width="1.5"
                height="4"
                rx="0.3"
                fill="currentColor"
                opacity="0.4"
              />
              <rect
                x="6.5"
                y="4"
                width="1.5"
                height="4"
                rx="0.3"
                fill="currentColor"
                opacity="0.4"
              />
            </svg>
          </div>

          {/* Content area — iframe handles its own scroll */}
          <div
            className="absolute inset-x-0 bottom-0 overflow-hidden"
            style={{ top: 40 }}
          >
            {children}
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 z-40 h-1 w-[134px] -translate-x-1/2 rounded-full bg-black/20" />
        </div>
      </div>
    </div>
  );
}
