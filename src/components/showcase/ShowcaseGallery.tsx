'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Heart,
  MessageCircle,
  Filter,
  Flame,
  Clock,
  MessageSquare,
  Search,
} from 'lucide-react';
import { showcaseApi } from '@/lib/api/services';
import { useToast } from '@/lib/hooks/use-toast';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { SubmitShowcaseModal } from './SubmitShowcaseModal';
import { ReportModal } from './ReportModal';
import { cn } from '@/lib/utils';
import type { ShowcaseProject } from '@/types';

interface ShowcaseGalleryProps {
  courseId: string;
  courseTitle?: string;
  initialProjects?: ShowcaseProject[];
  className?: string;
}

type SortOption = 'popular' | 'recent' | 'discussed';

export function ShowcaseGallery({
  courseId,
  courseTitle,
  initialProjects = [],
  className,
}: ShowcaseGalleryProps) {
  const toast = useToast();
  const [projects, setProjects] = useState<ShowcaseProject[]>(initialProjects);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [reportingProject, setReportingProject] = useState<ShowcaseProject | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch approved projects if none provided
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await showcaseApi.getByCourse(courseId);
        if (isMounted) {
          setProjects(data);
        }
      } catch {
        // Fallback or empty
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // Handle like from card directly
  const handleLike = async (e: React.MouseEvent, project: ShowcaseProject) => {
    e.stopPropagation();
    try {
      const res = await showcaseApi.likeProject(project.id);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? { ...p, likesCount: res.likesCount, hasLiked: res.hasLiked }
            : p,
        ),
      );
    } catch {
      toast.error({ title: 'Error', description: 'Could not update like.' });
    }
  };

  const handleReport = (e: React.MouseEvent, project: ShowcaseProject) => {
    e.stopPropagation();
    setReportingProject(project);
  };

  const handleProjectModalLike = (
    projectId: string,
    likesCount: number,
    hasLiked: boolean,
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, likesCount, hasLiked } : p,
      ),
    );
  };

  const handleNewProject = (newProject: ShowcaseProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  // Sort and filter
  const sortedProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return b.likesCount - a.likesCount;
        if (sortBy === 'recent')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'discussed')
          return (b.commentsCount || 0) - (a.commentsCount || 0);
        return 0;
      });
  }, [projects, sortBy, searchQuery]);

  return (
    <section className={cn('space-y-8', className)}>
      {/* Gallery Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-saffron-600" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold text-ink-900">
              Student Project Showcase
            </h2>
          </div>
          <p className="text-xs text-ink-500">
            Finished dresses, custom cakes, and artisanal makeup looks created by fellow learners.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSubmitOpen(true)}
          className="btn-primary inline-flex items-center gap-2 text-xs sm:self-center shrink-0 px-5 py-2.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Submit Your Work
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search projects or learners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 text-xs"
            aria-label="Search showcase gallery"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto" role="group" aria-label="Sort projects">
          <span className="text-xs font-medium text-ink-400 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Sort:
          </span>
          <button
            type="button"
            onClick={() => setSortBy('popular')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
              sortBy === 'popular'
                ? 'bg-saffron-500 text-white shadow-sm'
                : 'text-ink-600 hover:bg-ink-100',
            )}
          >
            <Flame className="h-3.5 w-3.5" />
            Popular
          </button>
          <button
            type="button"
            onClick={() => setSortBy('recent')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
              sortBy === 'recent'
                ? 'bg-saffron-500 text-white shadow-sm'
                : 'text-ink-600 hover:bg-ink-100',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Latest
          </button>
          <button
            type="button"
            onClick={() => setSortBy('discussed')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
              sortBy === 'discussed'
                ? 'bg-saffron-500 text-white shadow-sm'
                : 'text-ink-600 hover:bg-ink-100',
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Discussed
          </button>
        </div>
      </div>

      {/* Grid of Projects */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-ink-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-ink-200 rounded w-3/4" />
                <div className="h-3 bg-ink-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center space-y-3">
          <Sparkles className="mx-auto h-10 w-10 text-saffron-400" />
          <h3 className="font-display text-lg font-bold text-ink-900">
            No projects in this gallery yet
          </h3>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            Be the first to submit your approved assignment work and inspire fellow learners!
          </p>
          <button
            type="button"
            onClick={() => setIsSubmitOpen(true)}
            className="btn-primary mt-2 px-5 py-2 text-xs"
          >
            Submit First Project
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={(p) => setSelectedProject(p)}
              onLike={handleLike}
              onReport={handleReport}
            />
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
        onLikeChange={handleProjectModalLike}
      />

      {/* Submit Project Modal */}
      <SubmitShowcaseModal
        courseId={courseId}
        courseTitle={courseTitle}
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={handleNewProject}
      />

      {/* Report Modal */}
      {reportingProject && (
        <ReportModal
          project={reportingProject}
          isOpen={reportingProject !== null}
          onClose={() => setReportingProject(null)}
        />
      )}
    </section>
  );
}
