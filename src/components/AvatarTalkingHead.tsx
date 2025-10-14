'use client';
import React from 'react';
import Image from 'next/image';
// Default avatar in src/assets
import avatarDefault from '../assets/josh-avatar.png';

export default function AvatarTalkingHead({
  imgSrc,            // optional public path (e.g., '/favicon.ico'); if omitted we use the bundled default
  speaking = false,
  size = 80,
  className = '',
}: {
  imgSrc?: string;
  speaking?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <div className={['flex items-center gap-3', className].join(' ')}>
      <div className="relative">
        {/* Glowing ring when speaking */}
        {speaking && (
          <div 
            className="absolute inset-0 glow-pulse-teal"
            style={{ 
              borderRadius: '9999px',
              transform: 'scale(1.1)'
            }}
          />
        )}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Coach avatar"
            width={size}
            height={size}
            className="rounded-full border-2 border-white object-cover relative z-10 shadow-soft"
          />
        ) : (
          <Image
            src={avatarDefault}
            alt="Coach avatar"
            width={size}
            height={size}
            className="rounded-full border-2 border-white object-cover relative z-10 shadow-soft"
            priority
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        {speaking && (
          <span 
            className="w-2 h-2 rounded-full bg-gradient-to-br from-[#5ECBBC] to-[#3FA89C] glow-pulse-teal"
            aria-hidden="true"
          />
        )}
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }} aria-live="polite">
          {speaking ? 'Speaking…' : 'Ready'}
        </span>
      </div>
    </div>
  );
}