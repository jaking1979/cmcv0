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
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="Coach avatar"
          width={size}
          height={size}
          className="rounded-full border object-cover"
        />
      ) : (
        <Image
          src={avatarDefault}
          alt="Coach avatar"
          width={size}
          height={size}
          className="rounded-full border object-cover"
          priority
        />
      )}
      <span className="text-sm text-gray-600" aria-live="polite">
        {speaking ? 'Speaking…' : 'Ready'}
      </span>
    </div>
  );
}