# Technical Design - User Profile and Settings Pages

## Overview

A comprehensive user profile and account settings system for Hamplard students and instructors. Includes public profile viewing, role-specific settings pages with tabbed navigation, avatar upload, notification preferences, and account management.

---

## Routes and Pages

```
/profile/:stellarAddress         → src/app/profile/[address]/page.tsx
/settings                        → src/app/dashboard/settings/page.tsx
/settings/profile                → same page, profile tab active
/settings/account                → same page, account tab active
/settings/privacy                → same page, privacy tab active
/settings/notifications          → same page, notifications tab active
/settings/payment-methods        → same page, payment methods tab active
```

---

## Data Types

```ts
interface UserProfile {
  stellarAddress: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  isVerified: boolean;
  createdAt: string;
}

interface UserStats {
  totalCourses: number;       // enrolled (student) or teaching (instructor)
  averageRating: number;       // instructor only
  totalReviews: number;        // instructor only
  enrollmentCount: number;     // instructor only
  certificatesEarned: number;  // student only
}

interface NotificationPreference {
  type: 'course_update' | 'new_message' | 'purchase_confirmed' | 'review_received' | 'certificate_earned';
  enabled: boolean;
  email: boolean;
  inApp: boolean;
}

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'wallet';
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

interface SettingsState {
  profile: UserProfile;
  stats: UserStats;
  passwordChangeLoading: boolean;
  passwordChangeError?: string;
  notificationPreferences: NotificationPreference[];
  savedPaymentMethods: SavedPaymentMethod[];
  avatarFile?: File;
  avatarPreview?: string;
}
```

---

## Public Profile Page

### Route

```
/profile/G...AC (Stellar address)
```

### Layout

```
┌──────────────────────────────────────────────────┐
│ [Nav with Back button]                           │
├──────────────────────────────────────────────────┤
│                                                  │
│         [Avatar Circle - 120x120]                │
│              John Doe                            │
│         Verified ✓ Student                       │
│                                                  │
│  Bio/Description text                           │
│                                                  │
│  Social Links: [Twitter] [LinkedIn] [Portfolio] │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 12 Courses Enrolled      4.8 ★ (23 reviews)│ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Recent Courses:                                │
│  ┌──┐ ┌──┐ ┌──┐                                 │
│  │  │ │  │ │  │                                 │
│  │  │ │  │ │  │                                 │
│  └──┘ └──┘ └──┘                                 │
│  Course 1 | Course 2 | Course 3                │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Components

#### PublicProfilePage

```ts
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usersApi } from '@/lib/api/services';
import type { UserProfile, UserStats } from '@/types';

export default function PublicProfilePage() {
  const params = useParams<{ address: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileData, statsData] = await Promise.all([
          usersApi.getPublicProfile(params.address),
          usersApi.getPublicStats(params.address),
        ]);
        setProfile(profileData);
        setStats(statsData);
      } catch (err) {
        // Handle 404 etc.
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.address]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!profile) return <div className="text-center py-8">Profile not found</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <ProfileHeader profile={profile} stats={stats} />
      <ProfileContent profile={profile} stats={stats} />
    </div>
  );
}
```

#### ProfileHeader

```ts
interface ProfileHeaderProps {
  profile: UserProfile;
  stats: UserStats | null;
}

export function ProfileHeader({ profile, stats }: ProfileHeaderProps) {
  return (
    <div className="text-center mb-8">
      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <img
          src={profile.avatarUrl || 'https://via.placeholder.com/120'}
          alt={profile.name || 'User'}
          className="w-28 h-28 rounded-full object-cover border-4 border-saffron-200"
        />
      </div>

      {/* Name and Role */}
      <h1 className="text-3xl font-bold mb-2">{profile.name || 'Anonymous'}</h1>
      <div className="flex items-center justify-center gap-2 mb-4">
        {profile.isVerified && (
          <span className="text-leaf-600 text-sm font-semibold">✓ Verified</span>
        )}
        <span className="badge badge-secondary">
          {profile.role === 'INSTRUCTOR' ? 'Instructor' : 'Student'}
        </span>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-ink-600 mb-4 max-w-xl mx-auto">
          {profile.bio}
        </p>
      )}

      {/* Social Links */}
      {profile.socialLinks && (
        <div className="flex justify-center gap-4 mb-6">
          {profile.socialLinks.twitter && (
            <a href={profile.socialLinks.twitter} target="_blank" className="text-ink-400 hover:text-ink-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                {/* Twitter icon */}
              </svg>
            </a>
          )}
          {profile.socialLinks.linkedin && (
            <a href={profile.socialLinks.linkedin} target="_blank" className="text-ink-400 hover:text-ink-600">
              {/* LinkedIn icon */}
            </a>
          )}
          {/* Portfolio, GitHub */}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-50 p-4 rounded-lg">
            <p className="text-2xl font-bold">{stats.totalCourses}</p>
            <p className="text-sm text-ink-600">
              {profile.role === 'INSTRUCTOR' ? 'Courses Teaching' : 'Enrolled'}
            </p>
          </div>
          {profile.role === 'INSTRUCTOR' && (
            <>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-2xl font-bold">
                  {stats.averageRating.toFixed(1)} ★
                </p>
                <p className="text-sm text-ink-600">Rating</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-2xl font-bold">{stats.totalReviews}</p>
                <p className="text-sm text-ink-600">Reviews</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-2xl font-bold">{stats.enrollmentCount}</p>
                <p className="text-sm text-ink-600">Students</p>
              </div>
            </>
          )}
          {profile.role === 'STUDENT' && (
            <div className="bg-neutral-50 p-4 rounded-lg">
              <p className="text-2xl font-bold">{stats.certificatesEarned}</p>
              <p className="text-sm text-ink-600">Certificates</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### ProfileContent

```ts
interface ProfileContentProps {
  profile: UserProfile;
  stats: UserStats | null;
}

export function ProfileContent({ profile, stats }: ProfileContentProps) {
  return (
    <div className="space-y-8">
      {/* Recent Courses */}
      {stats && stats.totalCourses > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {profile.role === 'INSTRUCTOR' ? 'Featured Courses' : 'Enrolled Courses'}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Render course cards - fetch from API in component */}
            {/* Placeholder: */}
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-neutral-50 rounded-lg overflow-hidden">
                <div className="w-full h-40 bg-gradient-to-br from-saffron-200 to-saffron-400" />
                <div className="p-3">
                  <p className="font-semibold text-sm">Course {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Settings Page (`/settings`)

### Layout

```
┌──────────────────────────────────────────────────┐
│ [Nav]                                            │
├──────────────────────────────────────────────────┤
│                                                  │
│ Account Settings                                │
│                                                  │
│ [Profile][Account][Privacy][Notifications][Payment]
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Profile Tab                                 │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ Avatar                                  │ │ │
│ │ │ [Avatar Preview]  [Change Avatar]      │ │ │
│ │ │                                         │ │ │
│ │ │ Full Name: [____________________]      │ │ │
│ │ │ Bio: [____________________]             │ │ │
│ │ │ Website: [____________________]        │ │ │
│ │ │                                         │ │ │
│ │ │ Social Links                            │ │ │
│ │ │ Twitter: [____________________]        │ │ │
│ │ │ LinkedIn: [____________________]       │ │ │
│ │ │ GitHub: [____________________]         │ │ │
│ │ │                                         │ │ │
│ │ │ [Cancel] [Save Changes]                │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Tabs

#### Tab 1: Profile

```ts
interface ProfileTabProps {
  profile: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function ProfileTab({
  profile,
  onSave,
  isLoading,
  error,
}: ProfileTabProps) {
  const [formData, setFormData] = useState(profile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAvatarPreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Upload avatar if changed, then update profile
    let avatarUrl = profile.avatarUrl;
    if (avatarFile) {
      const result = await uploadsApi.upload(avatarFile, 'thumbnail');
      avatarUrl = result.url;
    }
    await onSave({ ...formData, avatarUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-lg mb-4">Profile Picture</h3>
        <div className="flex gap-6 items-start">
          <div>
            <img
              src={avatarPreview || profile.avatarUrl || 'https://via.placeholder.com/100'}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-saffron-200"
            />
          </div>
          <div>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <label
              htmlFor="avatar-upload"
              className="btn btn-secondary cursor-pointer"
            >
              Change Avatar
            </label>
            <p className="text-xs text-ink-500 mt-2">
              Max 2MB. JPG, PNG, or WebP.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-lg mb-4">Personal Information</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input w-full"
          />
          <textarea
            placeholder="Bio (up to 160 characters)"
            value={formData.bio || ''}
            onChange={(e) =>
              setFormData({ ...formData, bio: e.target.value.slice(0, 160) })
            }
            maxLength={160}
            rows={3}
            className="input w-full resize-none"
          />
          <div className="text-xs text-ink-500">
            {(formData.bio || '').length} / 160
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-lg mb-4">Social Links</h3>
        <div className="space-y-4">
          <input
            type="url"
            placeholder="Twitter (https://twitter.com/username)"
            value={formData.socialLinks?.twitter || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                socialLinks: {
                  ...formData.socialLinks,
                  twitter: e.target.value,
                },
              })
            }
            className="input w-full"
          />
          <input
            type="url"
            placeholder="LinkedIn (https://linkedin.com/in/username)"
            value={formData.socialLinks?.linkedin || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                socialLinks: {
                  ...formData.socialLinks,
                  linkedin: e.target.value,
                },
              })
            }
            className="input w-full"
          />
          <input
            type="url"
            placeholder="GitHub (https://github.com/username)"
            value={formData.socialLinks?.github || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                socialLinks: {
                  ...formData.socialLinks,
                  github: e.target.value,
                },
              })
            }
            className="input w-full"
          />
          <input
            type="url"
            placeholder="Portfolio (https://...)"
            value={formData.socialLinks?.portfolio || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                socialLinks: {
                  ...formData.socialLinks,
                  portfolio: e.target.value,
                },
              })
            }
            className="input w-full"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700 text-sm">
          ✕ {error}
        </div>
      )}

      <div className="flex gap-4 justify-end">
        <button type="button" className="btn btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
```

#### Tab 2: Account

```ts
interface AccountTabProps {
  profile: UserProfile;
  onChangePassword: (old: string, new: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function AccountTab({
  profile,
  onChangePassword,
  isLoading,
  error,
}: AccountTabProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      // Show error
      return;
    }
    await onChangePassword(oldPassword, newPassword);
    // Clear on success
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-8">
      {/* Account Info */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-lg mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2">
            <span className="text-ink-600">Stellar Address</span>
            <span className="font-mono font-semibold break-all">
              {profile.stellarAddress}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-ink-600">Account Created</span>
            <span>
              {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-ink-600">Email</span>
            <span>{profile.email || 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="border-b pb-6">
        <h3 className="font-bold text-lg mb-4">Change Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Current Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="input w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-3 text-ink-500"
            >
              {showPasswords ? '🙈' : '👁'}
            </button>
          </div>

          <input
            type={showPasswords ? 'text' : 'password'}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input w-full"
            required
          />

          <input
            type={showPasswords ? 'text' : 'password'}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input w-full"
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm">
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### Tab 3: Privacy

```ts
export function PrivacyTab() {
  const [profilePublic, setProfilePublic] = useState(true);
  const [allowMessaging, setAllowMessaging] = useState(true);

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg">Privacy Settings</h3>

      <div className="bg-neutral-50 p-4 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profilePublic}
            onChange={(e) => setProfilePublic(e.target.checked)}
            className="w-4 h-4"
          />
          <div>
            <p className="font-semibold">Public Profile</p>
            <p className="text-sm text-ink-600">
              Allow others to view your profile and courses
            </p>
          </div>
        </label>
      </div>

      <div className="bg-neutral-50 p-4 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowMessaging}
            onChange={(e) => setAllowMessaging(e.target.checked)}
            className="w-4 h-4"
          />
          <div>
            <p className="font-semibold">Allow Direct Messages</p>
            <p className="text-sm text-ink-600">
              Let other users send you messages
            </p>
          </div>
        </label>
      </div>

      <button className="btn btn-primary">
        Save Privacy Settings
      </button>
    </div>
  );
}
```

#### Tab 4: Notifications

```ts
interface NotificationsTabProps {
  preferences: NotificationPreference[];
  onSave: (preferences: NotificationPreference[]) => Promise<void>;
  isLoading: boolean;
}

export function NotificationsTab({
  preferences,
  onSave,
  isLoading,
}: NotificationsTabProps) {
  const [prefs, setPrefs] = useState(preferences);

  const handleToggle = (type: string, key: 'enabled' | 'email' | 'inApp') => {
    setPrefs(
      prefs.map(p =>
        p.type === type ? { ...p, [key]: !p[key] } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(prefs);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {prefs.map(pref => (
        <div key={pref.type} className="bg-neutral-50 p-4 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold">
                {formatNotificationType(pref.type)}
              </p>
              <p className="text-sm text-ink-600">
                {getNotificationDescription(pref.type)}
              </p>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pref.enabled}
                onChange={() => handleToggle(pref.type, 'enabled')}
                className="w-4 h-4"
              />
            </label>
          </div>

          {pref.enabled && (
            <div className="ml-4 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pref.email}
                  onChange={() => handleToggle(pref.type, 'email')}
                  className="w-4 h-4"
                />
                <span>Email notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pref.inApp}
                  onChange={() => handleToggle(pref.type, 'inApp')}
                  className="w-4 h-4"
                />
                <span>In-app notifications</span>
              </label>
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
}

function formatNotificationType(type: string): string {
  const map: Record<string, string> = {
    course_update: 'Course Updates',
    new_message: 'New Messages',
    purchase_confirmed: 'Purchase Confirmed',
    review_received: 'Review Received',
    certificate_earned: 'Certificate Earned',
  };
  return map[type] || type;
}

function getNotificationDescription(type: string): string {
  const map: Record<string, string> = {
    course_update: 'When a course you are enrolled in is updated',
    new_message: 'When you receive a new message',
    purchase_confirmed: 'When your course purchase is confirmed',
    review_received: 'When someone reviews your course',
    certificate_earned: 'When you earn a certificate',
  };
  return map[type] || '';
}
```

#### Tab 5: Payment Methods

```ts
interface PaymentMethodsTabProps {
  savedMethods: SavedPaymentMethod[];
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function PaymentMethodsTab({
  savedMethods,
  onDelete,
  onSetDefault,
  isLoading,
}: PaymentMethodsTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Saved Payment Methods</h3>

      {savedMethods.length === 0 ? (
        <p className="text-ink-600">No saved payment methods.</p>
      ) : (
        <div className="space-y-3">
          {savedMethods.map(method => (
            <div
              key={method.id}
              className={`border rounded-lg p-4 ${
                method.isDefault ? 'border-saffron-400 bg-saffron-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">
                    {method.type === 'card' && `•••• ${method.last4}`}
                    {method.type === 'paypal' && 'PayPal'}
                    {method.type === 'wallet' && 'Stellar Wallet'}
                  </p>
                  {method.expiryMonth && method.expiryYear && (
                    <p className="text-sm text-ink-600">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  )}
                  {method.isDefault && (
                    <p className="text-xs text-saffron-600 font-semibold mt-1">
                      DEFAULT
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => onSetDefault(method.id)}
                      className="text-sm btn btn-secondary"
                      disabled={isLoading}
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(method.id)}
                    className="text-sm btn btn-ghost text-red-600"
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary mt-6">
        + Add Payment Method
      </button>
    </div>
  );
}
```

### SettingsPage Component

```ts
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usersApi } from '@/lib/api/services';
import type { UserProfile, NotificationPreference } from '@/types';

type SettingsTab = 'profile' | 'account' | 'privacy' | 'notifications' | 'payment-methods';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get('tab') || 'profile') as SettingsTab;
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function load() {
      try {
        const data = await usersApi.getMe();
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Error loading settings</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b overflow-x-auto">
        {(['profile', 'account', 'privacy', 'notifications', 'payment-methods'] as const).map(
          tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 border-b-2 whitespace-nowrap capitalize ${
                activeTab === tab
                  ? 'border-saffron-600 text-saffron-600 font-bold'
                  : 'border-transparent text-ink-600'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          )
        )}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            onSave={async (data) => {
              const updated = await usersApi.updateMe(data);
              setProfile(updated);
            }}
            isLoading={loading}
            error={error}
          />
        )}
        {activeTab === 'account' && (
          <AccountTab
            profile={profile}
            onChangePassword={async (oldPwd, newPwd) => {
              // API call to change password
            }}
            isLoading={loading}
            error={error}
          />
        )}
        {activeTab === 'privacy' && <PrivacyTab />}
        {activeTab === 'notifications' && (
          <NotificationsTab
            preferences={[
              { type: 'course_update', enabled: true, email: true, inApp: true },
              { type: 'new_message', enabled: true, email: true, inApp: true },
              { type: 'purchase_confirmed', enabled: true, email: true, inApp: false },
              { type: 'review_received', enabled: true, email: false, inApp: true },
              { type: 'certificate_earned', enabled: true, email: true, inApp: true },
            ]}
            onSave={async () => {}}
            isLoading={loading}
          />
        )}
        {activeTab === 'payment-methods' && (
          <PaymentMethodsTab
            savedMethods={[]}
            onDelete={async () => {}}
            onSetDefault={async () => {}}
            isLoading={loading}
          />
        )}
      </div>
    </div>
  );
}
```

---

## File Structure

```
src/
  app/
    profile/
      [address]/
        page.tsx                     ← Public profile page
    dashboard/
      settings/
        page.tsx                     ← Settings page (all tabs)
  components/
    profile/
      PublicProfilePage.tsx
      ProfileHeader.tsx
      ProfileContent.tsx
    settings/
      ProfileTab.tsx
      AccountTab.tsx
      PrivacyTab.tsx
      NotificationsTab.tsx
      PaymentMethodsTab.tsx
      SettingsPage.tsx
```

---

## Mobile Responsiveness

### Public Profile (375px)

- Single column
- Avatar: 100x100px
- Stats: 2-column grid
- Course cards: 2-column grid

### Settings (375px)

- Tabs: horizontal scroll
- Form inputs: full width
- Avatar preview: centered

---

## API Additions Needed

```ts
// usersApi extensions
usersApi.getPublicProfile(address: string): Promise<UserProfile>
usersApi.getPublicStats(address: string): Promise<UserStats>
usersApi.changePassword(oldPassword: string, newPassword: string): Promise<void>
usersApi.getNotificationPreferences(): Promise<NotificationPreference[]>
usersApi.updateNotificationPreferences(prefs: NotificationPreference[]): Promise<void>
usersApi.getSavedPaymentMethods(): Promise<SavedPaymentMethod[]>
usersApi.deleteSavedPaymentMethod(id: string): Promise<void>
usersApi.setDefaultPaymentMethod(id: string): Promise<void>
```

---

## No New Dependencies

All functionality uses:
- React hooks: `useState`, `useEffect`, `useRef`
- Next.js routing: `useRouter`, `useSearchParams`, `useParams`
- Existing API: `usersApi`, `uploadsApi`
- Tailwind utility classes
- `lucide-react` for icons
