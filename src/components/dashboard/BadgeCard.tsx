'use client';

import React, { useState } from 'react';
import {
  Award,
  Flame,
  BookOpen,
  ClipboardCheck,
  Zap,
  GraduationCap,
  Moon,
  Trophy,
  Lock,
  CheckCircle2,
  Share2,
  X,
  Calendar,
} from 'lucide-react';
import type { Achievement } from '@/types';
import { SocialShare } from '@/components/ui/SocialShare';

interface BadgeCardProps {
  badge: Achievement;
  onSelect?: (badge: Achievement) => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Award,
  Flame,
  BookOpen,
  ClipboardCheck,
  Zap,
  GraduationCap,
  Moon,
  Trophy,
};

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  rare: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  epic: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  legendary: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-400' },
};

export function BadgeCard({ badge, onSelect, className = '' }: BadgeCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const IconComponent = ICON_MAP[badge.icon] || Award;
  const rarity = badge.rarity || 'common';
  const rarityStyle = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  const handleClick = () => {
    onSelect?.(badge);
    setModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const formattedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`${badge.title} badge - ${badge.earned ? 'Earned' : 'Locked'}`}
        className={`group relative card p-5 flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:shadow-lifted focus:outline-none focus:ring-2 focus:ring-hamplard-primary ${
          badge.earned
            ? 'bg-white border-ink-100 hover:border-saffron-300'
            : 'bg-ink-50/60 border-dashed border-ink-200 opacity-75 hover:opacity-90'
        } ${className}`}
      >
        {/* Rarity Pill */}
        <div className="w-full flex items-center justify-between mb-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border}`}
          >
            {rarity}
          </span>
          {badge.earned ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-leaf-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Earned
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-ink-400">
              <Lock className="w-3.5 h-3.5" />
              Locked
            </span>
          )}
        </div>

        {/* Badge Icon Emblem */}
        <div
          className={`relative w-16 h-16 rounded-2xl flex items-center justify-center my-3 transition-transform duration-200 group-hover:scale-105 ${
            badge.earned
              ? 'bg-gradient-to-tr from-saffron-500 via-amber-400 to-saffron-300 text-white shadow-md shadow-saffron-500/20'
              : 'bg-ink-200 text-ink-400'
          }`}
        >
          <IconComponent className="w-8 h-8" />
          {!badge.earned && (
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white border border-ink-200 text-ink-500 shadow-xs">
              <Lock className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-sm text-ink-900 group-hover:text-hamplard-primary transition-colors">
          {badge.title}
        </h3>
        <p className="text-xs text-ink-500 mt-1 line-clamp-2 leading-relaxed">
          {badge.description}
        </p>

        {/* Footer State: Date or Progress Bar */}
        <div className="w-full mt-4 pt-3 border-t border-ink-100 flex items-center justify-center text-xs">
          {badge.earned ? (
            <span className="text-[11px] text-ink-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate ? `Earned ${formattedDate}` : 'Earned'}
            </span>
          ) : (
            <div className="w-full">
              <div className="flex justify-between text-[11px] text-ink-500 mb-1">
                <span>Progress</span>
                <span>{badge.progress ?? 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-ink-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-hamplard-primary rounded-full transition-all duration-300"
                  style={{ width: `${badge.progress ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badge Detail Modal Dialog */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`badge-modal-${badge.id}`}
        >
          <div
            className="card bg-white max-w-md w-full p-6 relative overflow-hidden shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
              aria-label="Close badge modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emblem in Modal */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${
                  badge.earned
                    ? 'bg-gradient-to-tr from-saffron-500 via-amber-400 to-saffron-300 text-white shadow-lg shadow-saffron-500/30'
                    : 'bg-ink-200 text-ink-400'
                }`}
              >
                <IconComponent className="w-10 h-10" />
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border}`}
                >
                  {rarity}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    badge.earned ? 'text-leaf-600' : 'text-ink-500'
                  }`}
                >
                  {badge.earned ? 'Earned Achievement' : 'Locked Achievement'}
                </span>
              </div>

              <h2
                id={`badge-modal-${badge.id}`}
                className="text-lg font-bold text-ink-900 mt-1"
              >
                {badge.title}
              </h2>
              <p className="text-xs text-ink-600 mt-1 max-w-xs">{badge.description}</p>
            </div>

            {/* How to Earn Criteria */}
            <div className="mt-5 p-3.5 bg-ink-50 rounded-xl border border-ink-100">
              <h4 className="text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1">
                How to earn
              </h4>
              <p className="text-xs text-ink-600 leading-relaxed">{badge.criteria}</p>
              {formattedDate && (
                <p className="text-[11px] text-ink-400 mt-2 pt-2 border-t border-ink-200">
                  Earned on {formattedDate}
                </p>
              )}
            </div>

            {/* Social Share section when earned */}
            {badge.earned ? (
              <div className="mt-5">
                <p className="text-xs font-semibold text-ink-700 mb-2 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-saffron-600" />
                  Share your achievement
                </p>
                <SocialShare
                  shareText={`I just earned the "${badge.title}" badge on Hamplard! Check out my learning milestone.`}
                  courseTitle={badge.title}
                  size="sm"
                />
              </div>
            ) : (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-ink-600 mb-1 font-medium">
                  <span>Current Progress</span>
                  <span>{badge.progress ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-hamplard-primary rounded-full"
                    style={{ width: `${badge.progress ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default BadgeCard;
