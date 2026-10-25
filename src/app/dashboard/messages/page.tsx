'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { MessagesInbox } from '@/components/messages/MessagesInbox';

export default function MessagesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-ink-500 mb-4 sm:mb-6" aria-label="Breadcrumbs">
        <Link href="/dashboard" className="hover:text-ink-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
        <span className="font-medium text-ink-900">Messages</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink-900 flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-hamplard-primary" />
            Instructor Messages
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Connect directly with your course instructors for personalized feedback and guidance.
          </p>
        </div>
      </div>

      {/* Messages Inbox Container */}
      <MessagesInbox />
    </div>
  );
}
