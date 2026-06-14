'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Upload } from 'lucide-react';
import { registerCourseOnChain } from '@/lib/stellar/contract';
import { coursesApi, uploadsApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { generateCourseId, usdcToStroops } from '@/lib/utils';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;

const CATEGORIES = [
  'Tailoring', 'Makeup Artistry', 'Baking', 'Hairstyling',
  'Photography', 'Nail Technology', 'Fashion Design', 'Eyelash Extension',
  'Other',
];

export default function CreateCoursePage() {
  const router = useRouter();
  const { address } = useAuthStore();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [level,       setLevel]       = useState('Beginner');
  const [language,    setLanguage]    = useState('English');
  const [price,       setPrice]       = useState('');
  const [thumbnail,   setThumbnail]   = useState<File | null>(null);
  const [thumbnailUrl,setThumbnailUrl]= useState('');
  const [loading,     setLoading]     = useState(false);
  const [txStep,      setTxStep]      = useState('');
  const [error,       setError]       = useState<string | null>(null);

  const courseId = generateCourseId(category || 'COURSE');

  const handleThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(file);
    try {
      const { url } = await uploadsApi.upload(file, 'thumbnail');
      setThumbnailUrl(url);
    } catch (err) {
      console.error('Thumbnail upload failed', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setError(null);
    setLoading(true);

    try {
      // 1. Create course draft in backend
      setTxStep('Creating course record…');
      await coursesApi.create({
        courseId,
        title,
        description,
        category,
        level,
        language,
        thumbnailUrl: thumbnailUrl || undefined,
        price: parseFloat(price),
      });

      // 2. Register on-chain
      setTxStep('Registering on Stellar — sign in Freighter…');
      const txHash = await registerCourseOnChain({
        callerAddress:  address,
        courseId,
        price:          usdcToStroops(price),
        tokenAddress:   USDC_ADDRESS,
      });

      // 3. Submit for review
      setTxStep('Submitting for admin review…');
      await coursesApi.submitForReview(courseId, txHash);

      router.push(`/dashboard/instructor`);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setTxStep('');
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/instructor"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <h1 className="section-heading mb-1">Create a new course</h1>
      <p className="text-sm text-ink-500 mb-6">
        Fill in the details below. After submission, your course will be reviewed by the Hamplard team before going live.
      </p>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic info */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink-900 mb-4">Course details</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Course ID</label>
              <input value={courseId} readOnly
                className="input bg-ink-50 text-ink-400 font-mono text-xs" />
              <p className="text-xs text-ink-400 mt-1">Auto-generated unique identifier</p>
            </div>
            <div>
              <label className="label">Course title <span className="text-red-500">*</span></label>
              <input
                placeholder="e.g. Professional Tailoring from Scratch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                placeholder="What will students learn in this course?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category <span className="text-red-500">*</span></label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="select"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="select">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select">
                <option>English</option>
                <option>Yoruba</option>
                <option>Hausa</option>
                <option>Igbo</option>
                <option>French</option>
                <option>Pidgin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink-900 mb-4">Course thumbnail</h2>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnail}
              className="sr-only"
            />
            <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              thumbnailUrl
                ? 'border-leaf-300 bg-leaf-50'
                : 'border-ink-200 hover:border-saffron-300 hover:bg-saffron-50'
            }`}>
              {thumbnailUrl ? (
                <div>
                  <img src={thumbnailUrl} alt="Thumbnail" className="h-24 mx-auto rounded-lg object-cover mb-2" />
                  <p className="text-xs text-leaf-600 font-medium">Thumbnail uploaded ✓</p>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-ink-300 mx-auto mb-2" />
                  <p className="text-sm text-ink-500">Click to upload thumbnail</p>
                  <p className="text-xs text-ink-400 mt-1">PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Pricing */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink-900 mb-4">Pricing</h2>
          <div>
            <label className="label">Course price (USDC) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="50.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="input pl-7"
              />
            </div>
            <p className="text-xs text-ink-400 mt-1.5">
              Platform keeps 20% · You receive 80% of each enrollment payment
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{txStep || 'Processing…'}</>
              : 'Register course & submit for review'
            }
          </button>
          <Link href="/dashboard/instructor" className="btn-secondary">Cancel</Link>
        </div>

        <p className="text-xs text-ink-400 text-center">
          This will open Freighter to sign the on-chain registration. Your course will be reviewed within 48 hours.
        </p>
      </form>
    </div>
  );
}
