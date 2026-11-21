'use client';

import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Flag,
  X,
  Send,
  Calendar,
  User,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { showcaseApi } from '@/lib/api/services';
import { useToast } from '@/lib/hooks/use-toast';
import { ReportModal } from './ReportModal';
import { cn } from '@/lib/utils';
import type { ShowcaseProject, ShowcaseComment } from '@/types';

interface ProjectModalProps {
  project: ShowcaseProject | null;
  isOpen: boolean;
  onClose: () => void;
  onLikeChange?: (projectId: string, likesCount: number, hasLiked: boolean) => void;
}

export function ProjectModal({
  project,
  isOpen,
  onClose,
  onLikeChange,
}: ProjectModalProps) {
  const toast = useToast();
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Local state for live likes and comments within the open modal
  const [likesCount, setLikesCount] = useState(project?.likesCount ?? 0);
  const [hasLiked, setHasLiked] = useState(project?.hasLiked ?? false);
  const [comments, setComments] = useState<ShowcaseComment[]>(project?.comments ?? []);

  // Sync state whenever project changes
  React.useEffect(() => {
    if (project) {
      setLikesCount(project.likesCount);
      setHasLiked(!!project.hasLiked);
      setComments(project.comments ?? []);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleLike = async () => {
    try {
      const res = await showcaseApi.likeProject(project.id);
      setLikesCount(res.likesCount);
      setHasLiked(res.hasLiked);
      onLikeChange?.(project.id, res.likesCount, res.hasLiked);
    } catch {
      toast.error({ title: 'Error', description: 'Could not update like.' });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await showcaseApi.commentProject(project.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      toast.success({ title: 'Comment posted!' });
    } catch {
      toast.error({ title: 'Error', description: 'Could not post comment.' });
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      >
        <div className="relative flex flex-col lg:flex-row w-full max-w-5xl overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-2xl max-h-[92vh] animate-in fade-in zoom-in-95">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-ink-600 shadow-md backdrop-blur-sm hover:bg-white hover:text-ink-900 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left Column: Full Project Image */}
          <div className="relative flex-1 bg-ink-950 flex items-center justify-center min-h-[320px] lg:min-h-[560px]">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="max-h-[85vh] w-full object-contain"
            />
          </div>

          {/* Right Column: Details, Likes, Comments */}
          <div className="flex w-full lg:w-[420px] flex-col justify-between border-t lg:border-t-0 lg:border-l border-ink-100 bg-white">
            {/* Header & Description */}
            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              {/* Student info */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {project.studentAvatar ? (
                    <img
                      src={project.studentAvatar}
                      alt={project.studentName}
                      className="h-10 w-10 rounded-full object-cover border border-saffron-200"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-100 text-saffron-700 font-semibold">
                      {project.studentName[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="font-display text-sm font-bold text-ink-900">
                      {project.studentName}
                    </h4>
                    <p className="text-[11px] text-ink-400">
                      Completed Assignment • {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Report button */}
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-red-600 transition-colors"
                  title="Report inappropriate content"
                  aria-label="Report project"
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 id="project-modal-title" className="font-display text-xl font-bold text-ink-900">
                  {project.title}
                </h3>
                <p className="text-xs leading-relaxed text-ink-600">
                  {project.description}
                </p>
              </div>

              {/* Actions row: Like & Comment Counts */}
              <div className="flex items-center justify-between border-y border-ink-100 py-3">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleLike}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                      hasLiked
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-ink-100 text-ink-600 hover:bg-rose-50 hover:text-rose-600',
                    )}
                    aria-label={hasLiked ? 'Unlike project' : 'Like project'}
                  >
                    <Heart
                      className={cn('h-4 w-4', hasLiked && 'fill-rose-500 text-rose-500')}
                    />
                    <span>{likesCount}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-ink-500">
                    <MessageCircle className="h-4 w-4" />
                    <span>{comments.length} comments</span>
                  </div>
                </div>

                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Verified Work
                </span>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400">
                  Discussion
                </h4>
                {comments.length === 0 ? (
                  <p className="py-4 text-center text-xs text-ink-400">
                    No comments yet. Be the first to congratulate {project.studentName}!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5 rounded-xl bg-ink-50 p-3 text-xs">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-saffron-800 font-bold text-[10px]">
                          {comment.userName[0]}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink-900">{comment.userName}</span>
                            <span className="text-[10px] text-ink-400">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-ink-600 leading-normal">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comment Form input pinned at bottom */}
            <form onSubmit={handleAddComment} className="border-t border-ink-100 p-4 bg-ink-50/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Write an encouraging comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="input text-xs flex-1 bg-white"
                  aria-label="Add a comment"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
                  aria-label="Send comment"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        project={project}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
}
