'use client';

import React, { useState } from 'react';
import { Upload, X, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { showcaseApi } from '@/lib/api/services';
import { useToast } from '@/lib/hooks/use-toast';
import type { ShowcaseProject } from '@/types';

interface SubmitShowcaseModalProps {
  courseId: string;
  courseTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProject: ShowcaseProject) => void;
}

export function SubmitShowcaseModal({
  courseId,
  courseTitle,
  isOpen,
  onClose,
  onSuccess,
}: SubmitShowcaseModalProps) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [assignmentId, setAssignmentId] = useState('final-assignment');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !imageUrl.trim()) {
      toast.warning({
        title: 'Missing fields',
        description: 'Please provide a title, description, and project image URL.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await showcaseApi.submitProject({
        courseId,
        assignmentId,
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
      });

      toast.success({
        title: 'Project submitted! 🎉',
        description: 'Your project is now published to the course showcase gallery.',
      });
      onSuccess(created);
      onClose();
    } catch {
      toast.error({
        title: 'Submission failed',
        description: 'Unable to submit your project right now. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sampleImages = [
    { label: 'Dress / Fashion', url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800' },
    { label: 'Cake / Pastry', url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=800' },
    { label: 'Makeup / Glam', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800' },
    { label: 'Leatherwork', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-showcase-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-ink-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="submit-showcase-title" className="font-display text-lg font-bold text-ink-900">
                Submit to Showcase Gallery
              </h3>
              <p className="text-xs text-ink-500">
                Showcase your finished project to fellow learners and instructors.
              </p>
            </div>
          </div>

          {/* Project Title */}
          <div>
            <label htmlFor="project-title" className="label text-xs">
              Project Title *
            </label>
            <input
              id="project-title"
              type="text"
              placeholder="e.g. Traditional Handcrafted Ankara Ballgown"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-xs"
              required
            />
          </div>

          {/* Assignment Source */}
          <div>
            <label htmlFor="assignment-select" className="label text-xs">
              Associated Approved Assignment
            </label>
            <select
              id="assignment-select"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              className="input text-xs bg-white"
            >
              <option value="final-assignment">Assignment 4: Final Practical Capstone (Approved ✅)</option>
              <option value="module-2">Module 2 Practical: Garment Draping (Approved ✅)</option>
              <option value="module-1">Module 1 Practical: Seam Finishing (Approved ✅)</option>
            </select>
            <p className="mt-1 text-[11px] text-ink-400">
              Only approved assignments can be submitted to the gallery.
            </p>
          </div>

          {/* Image URL with preset samples */}
          <div>
            <label htmlFor="image-url" className="label text-xs">
              Finished Work Photo URL *
            </label>
            <input
              id="image-url"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input text-xs"
              required
            />
            {/* Quick sample image pickers */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
              <span>Quick sample:</span>
              {sampleImages.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setImageUrl(s.url)}
                  className="rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-700 hover:bg-saffron-100 hover:text-saffron-800 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Image */}
          {imageUrl && (
            <div className="overflow-hidden rounded-2xl border border-ink-100 aspect-video bg-ink-50">
              <img
                src={imageUrl}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={() => {
                  toast.error({ title: 'Invalid image URL', description: 'Could not load image preview.' });
                }}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="project-desc" className="label text-xs">
              Project Description & Techniques Used *
            </label>
            <textarea
              id="project-desc"
              rows={3}
              placeholder="Tell us about the fabric, baking tools, color palette, or sewing techniques you applied..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2 text-xs"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-5 py-2 text-xs flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Publish to Showcase
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
