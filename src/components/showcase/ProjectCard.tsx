'use client';

import React from 'react';
import { Heart, MessageCircle, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShowcaseProject } from '@/types';

interface ProjectCardProps {
  project: ShowcaseProject;
  onOpen: (project: ShowcaseProject) => void;
  onLike: (e: React.MouseEvent, project: ShowcaseProject) => void;
  onReport: (e: React.MouseEvent, project: ShowcaseProject) => void;
}

export function ProjectCard({
  project,
  onOpen,
  onLike,
  onReport,
}: ProjectCardProps) {
  return (
    <article
      onClick={() => onOpen(project)}
      className="card group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-saffron-300"
    >
      {/* Image Container with overlays */}
      <div className="relative overflow-hidden bg-ink-100 aspect-[4/3]">
        <img
          src={project.imageUrl}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover overlay with action buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-between p-4">
          <button
            type="button"
            onClick={(e) => onReport(e, project)}
            className="rounded-full bg-black/40 p-1.5 text-white/80 hover:bg-red-600 hover:text-white transition-colors"
            title="Report inappropriate content"
            aria-label="Report project"
          >
            <Flag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-display text-base font-bold text-ink-900 line-clamp-1 group-hover:text-saffron-700 transition-colors">
          {project.title}
        </h3>

        <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Footer: Student & Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-ink-100 text-xs">
          <div className="flex items-center gap-2">
            {project.studentAvatar ? (
              <img
                src={project.studentAvatar}
                alt={project.studentName}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-saffron-100 text-saffron-800 text-[10px] font-bold">
                {project.studentName[0]}
              </div>
            )}
            <span className="font-medium text-ink-700 truncate max-w-[110px]">
              {project.studentName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Like button */}
            <button
              type="button"
              onClick={(e) => onLike(e, project)}
              className={cn(
                'flex items-center gap-1 font-semibold transition-colors',
                project.hasLiked
                  ? 'text-rose-600'
                  : 'text-ink-400 hover:text-rose-600',
              )}
              aria-label={project.hasLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={cn('h-3.5 w-3.5', project.hasLiked && 'fill-rose-500')}
              />
              <span>{project.likesCount}</span>
            </button>

            {/* Comments count */}
            <span className="flex items-center gap-1 text-ink-400 font-medium">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{project.commentsCount || project.comments?.length || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
