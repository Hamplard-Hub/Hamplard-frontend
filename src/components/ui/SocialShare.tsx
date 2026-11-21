'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Facebook, Linkedin, Twitter, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SocialShareProps {
  /** Page URL to share (defaults to current page URL) */
  url?: string;
  /** Course title for pre-filled text */
  courseTitle?: string;
  /** Custom text included in supported platform share dialogs */
  shareText?: string;
  /** Thumbnail image URL shown in the preview card */
  thumbnailUrl?: string;
  /** Size of buttons */
  size?: 'sm' | 'md' | 'lg';
  /** Show as icon-only or with text */
  variant?: 'icon' | 'label';
  /** Custom CSS class */
  className?: string;
}

// ── Link preview card ────────────────────────────────────────────────────────

interface LinkPreviewProps {
  url: string;
  title: string;
  thumbnailUrl?: string;
}

function LinkPreview({ url, title, thumbnailUrl }: LinkPreviewProps) {
  let domain = '';
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    domain = url;
  }

  const truncatedTitle = title.length > 80 ? `${title.slice(0, 77)}…` : title;

  return (
    <div
      className="mb-3 flex items-center gap-3 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 p-3"
      aria-label={`Link preview for ${title}`}
    >
      {thumbnailUrl ? (
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={thumbnailUrl}
            alt={`Thumbnail for ${title}`}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : (
        /* Graceful fallback when no thumbnail is provided */
        <div
          className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-ink-100"
          aria-hidden="true"
        >
          <LinkIcon className="h-5 w-5 text-ink-400" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-snug text-ink-900">{truncatedTitle}</p>
        <p className="mt-0.5 truncate text-xs text-ink-400">{domain}</p>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function SocialShare({
  url,
  courseTitle = 'a course',
  shareText,
  thumbnailUrl,
  size = 'md',
  variant = 'label',
  className,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);

  const achievementText = shareText ?? `I just completed ${courseTitle} on Hamplard! #Hamplard`;
  const encodedAchievementText = encodeURIComponent(achievementText);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleLinkedInShare = () => {
    if (!shareUrl) return;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400',
    );
  };

  const handleTwitterShare = () => {
    if (!shareUrl) return;
    window.open(
      `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedAchievementText}`,
      '_blank',
      'noopener,noreferrer,width=550,height=420',
    );
  };

  const handleFacebookShare = () => {
    if (!shareUrl) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedAchievementText}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400',
    );
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonClass = cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hamplard-primary',
    'hover:scale-105 active:scale-95',
    sizeClasses[size],
  );

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Link preview card — updates whenever url/courseTitle/thumbnailUrl props change */}
      {shareUrl && (
        <LinkPreview url={shareUrl} title={courseTitle} thumbnailUrl={thumbnailUrl} />
      )}

      <div className="flex flex-wrap gap-2">
        {/* LinkedIn */}
        <button
          type="button"
          onClick={handleLinkedInShare}
          aria-label="Share on LinkedIn"
          className={cn(buttonClass, 'bg-[#0A66C2] text-white hover:bg-[#084399]')}
        >
          <Linkedin className={iconSizes[size]} aria-hidden="true" />
          {variant === 'label' && <span>LinkedIn</span>}
        </button>

        {/* Twitter/X */}
        <button
          type="button"
          onClick={handleTwitterShare}
          aria-label="Share on Twitter"
          className={cn(buttonClass, 'bg-black text-white hover:bg-ink-900')}
        >
          <Twitter className={iconSizes[size]} aria-hidden="true" />
          {variant === 'label' && <span>X</span>}
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={handleFacebookShare}
          aria-label="Share on Facebook"
          className={cn(buttonClass, 'bg-[#1877F2] text-white hover:bg-[#0c63d4]')}
        >
          <Facebook className={iconSizes[size]} aria-hidden="true" />
          {variant === 'label' && <span>Facebook</span>}
        </button>

        {/* Copy link */}
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label={copied ? 'Link copied' : 'Copy share link'}
          className={cn(
            buttonClass,
            copied ? 'bg-leaf-100 text-leaf-700' : 'bg-ink-100 text-ink-700 hover:bg-ink-200',
          )}
        >
          {copied ? (
            <>
              <CheckCircle2 className={iconSizes[size]} aria-hidden="true" />
              {variant === 'label' && <span>Copied!</span>}
            </>
          ) : (
            <>
              <LinkIcon className={iconSizes[size]} aria-hidden="true" />
              {variant === 'label' && <span>Copy link</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SocialShare;
