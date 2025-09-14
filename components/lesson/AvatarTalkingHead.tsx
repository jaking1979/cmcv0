"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  src?: string;
  alt?: string;
  size?: number;           // px
  speaking?: boolean;      // toggles mouth animation
  loopBlinkMs?: number;    // blink interval
  className?: string;
};

export default function AvatarTalkingHead({
  src = "/assets/josh-avatar.png",
  alt = "Coach avatar",
  size = 160,
  speaking = false,
  loopBlinkMs = 4800,
  className = "",
}: Props) {
  const [blink, setBlink] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);
  const mouthRef = useRef<number | null>(null);
  const blinkRef = useRef<number | null>(null);

  // Blink loop
  useEffect(() => {
    const tick = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120); // quick blink
      blinkRef.current = window.setTimeout(tick, loopBlinkMs + Math.random() * 1200);
    };
    tick();
    return () => {
      if (blinkRef.current) window.clearTimeout(blinkRef.current);
    };
  }, [loopBlinkMs]);

  // Mouth loop while speaking
  useEffect(() => {
    if (!speaking) {
      if (mouthRef.current) window.clearInterval(mouthRef.current);
      setMouthPhase(0);
      return;
    }
    const phases = [0, 1, 2, 1]; // closed → mid → open → mid …
    let i = 0;
    mouthRef.current = window.setInterval(() => {
      i = (i + 1) % phases.length;
      setMouthPhase(phases[i]);
    }, 120);
    return () => {
      if (mouthRef.current) window.clearInterval(mouthRef.current);
    };
  }, [speaking]);

  // Simple head bob while speaking
  const bobStyle = useMemo<React.CSSProperties>(() => {
    return speaking
      ? { transform: "translateY(-2px)", transition: "transform 120ms" }
      : { transform: "translateY(0px)", transition: "transform 200ms" };
  }, [speaking]);

  return (
    <div
      className={["relative select-none", className].join(" ")}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Base avatar */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain drop-shadow-sm"
        style={bobStyle}
        draggable={false}
      />

      {/* Eyes overlay (simple lids) */}
      <div className="pointer-events-none absolute inset-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Adjust these positions to your avatar's eyes if needed */}
          <g opacity={blink ? 1 : 0} style={{ transition: "opacity 80ms" }}>
            <rect x="33" y="35" width="12" height="10" rx="2" fill="#00000099" />
            <rect x="58" y="35" width="12" height="10" rx="2" fill="#00000099" />
          </g>
        </svg>
      </div>

      {/* Mouth overlay */}
      <div className="pointer-events-none absolute inset-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Position over your mouth area; tweak cx/cy/width/height as needed */}
          {mouthPhase === 0 && (
            <rect x="44" y="62" width="12" height="2" rx="1" fill="#2b1b12" />
          )}
          {mouthPhase === 1 && (
            <ellipse cx="50" cy="64.5" rx="7.5" ry="4" fill="#2b1b12" />
          )}
          {mouthPhase === 2 && (
            <ellipse cx="50" cy="67" rx="8.5" ry="7" fill="#2b1b12" />
          )}
        </svg>
      </div>
    </div>
  );
}
