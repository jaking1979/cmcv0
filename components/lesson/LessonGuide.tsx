"use client";
import React from "react";
import AvatarTalkingHead from "./AvatarTalkingHead";

type Props = {
  children: React.ReactNode;  // lesson text (AI speaking)
  speaking?: boolean;         // controls avatar mouth animation
  title?: string;             // optional heading
  className?: string;
};

export default function LessonGuide({ children, speaking = true, title, className = "" }: Props) {
  return (
    <section
      className={[
        "w-full max-w-3xl mx-auto p-4 sm:p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 shadow",
        className,
      ].join(" ")}
    >
      {title ? (
        <h2 className="text-lg font-semibold tracking-tight mb-3">{title}</h2>
      ) : null}
      <div className="flex items-start gap-4">
        <AvatarTalkingHead speaking={speaking} size={140} />
        <div
          className="relative flex-1 rounded-xl px-4 py-3 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200/60 dark:ring-blue-900/40"
          aria-live="polite"
          aria-atomic="true"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
