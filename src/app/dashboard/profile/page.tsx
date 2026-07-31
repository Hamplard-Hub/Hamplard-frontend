'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Pencil, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { usersApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { Breadcrumb } from '@/components/ui';
import type { User as UserType } from '@/types';

export default function ProfilePage() {
  const router     = useRouter();
  const updateUser = useAuthStore((s) => s.updateUser);
  const authUser   = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);

  const [me,    setMe]    = useState<UserType | null>(null);
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [bio,   setBio]   = useState('');

  useEffect(() => {
    let mounted = true;
    usersApi
      .getMe()
      .then((u) => {
        if (!mounted) return;
        setMe(u);
        setName(u.name ?? '');
        setEmail(u.email ?? '');
        setBio(u.bio ?? '');
      })
      .catch((e) => { if (mounted) setError(e?.message ?? 'Failed to load profile'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await usersApi.updateMe({
        name:  name.trim(),
        email: email.trim() || undefined,
        bio:   bio.trim()   || undefined,
      });
      setMe(updated);
      updateUser({ name: updated.name, email: updated.email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-2.5 w-2.5 rounded-full bg-saffron-500 animate-pulse" />
        <div className="ml-3 text-sm text-ink-500">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Profile' },
          ]}
          className="mb-3"
        />
        <h1 className="section-heading">Profile</h1>
        <p className="text-sm text-ink-500 mt-1">Update your public information.</p>
      </div>

      {error && (
        <div className="card p-4 mb-5 border border-red-100 text-red-700 bg-red-50">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── Col 1: Avatar upload ── */}
        <div className="lg:col-span-1">
          <div className="card p-6 flex flex-col items-center">
            <p className="mb-4 w-full text-sm font-semibold text-ink-900">Profile photo</p>
            <AvatarUpload
              currentAvatarUrl={authUser?.avatarUrl ?? me?.avatarUrl}
              userName={me?.name}
              onSaved={(url) =>
                setMe((prev) => (prev ? { ...prev, avatarUrl: url } : prev))
              }
            />
          </div>
        </div>

        {/* ── Col 2: Info form ── */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-saffron-50 border border-saffron-100 flex items-center justify-center">
                <User className="w-5 h-5 text-saffron-700" />
              </div>
              <div>
                <p className="text-xs text-ink-400">Your identity</p>
                <p className="font-display text-lg font-semibold text-ink-900">
                  {me?.name ?? 'Your name'}
                </p>
                <p className="text-xs text-ink-400">
                  Role: {me?.role?.toLowerCase() ?? 'student'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-ink-500">Name</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2">
                  <Pencil className="w-3.5 h-3.5 text-ink-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm text-ink-900 bg-transparent outline-none"
                    placeholder="Your name"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-ink-500">Email</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2">
                  <Mail className="w-3.5 h-3.5 text-ink-400" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm text-ink-900 bg-transparent outline-none"
                    placeholder="name@example.com"
                  />
                </div>
                <p className="text-[11px] text-ink-400 mt-1">
                  Used for account messages and verification.
                </p>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-ink-500">Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none"
                  placeholder="Tell students about your skills…"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>

                {saved && (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-leaf-700 bg-leaf-50 border border-leaf-200 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Next-steps sidebar (sits below form on this column on lg) ── */}
          <div className="card p-6 mt-5">
            <p className="text-sm font-semibold text-ink-900">Next steps</p>
            <p className="text-sm text-ink-500 mt-1">
              Keep your profile up to date to improve your course and certificate trust.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/dashboard/settings" className="btn-secondary inline-flex">
                Go to settings
              </Link>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="btn-ghost inline-flex"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
