'use client';

import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, BookOpen, User } from 'lucide-react';
import type { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  className = '',
}: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const term = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.participantName.toLowerCase().includes(term) ||
        c.courseTitle?.toLowerCase().includes(term) ||
        c.lastMessage?.content.toLowerCase().includes(term)
    );
  }, [conversations, search]);

  return (
    <div className={`flex flex-col h-full bg-white border-r border-ink-100 ${className}`}>
      {/* Header and Search */}
      <div className="p-3 sm:p-4 border-b border-ink-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base text-ink-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-hamplard-primary" />
            Messages
          </h2>
          <span className="text-xs text-ink-500 font-medium">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search instructors or courses..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-ink-50 border border-ink-200 rounded-xl focus:outline-none focus:border-hamplard-primary focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-ink-50" role="list">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-ink-400 text-xs">
            <User className="w-8 h-8 text-ink-300 mx-auto mb-2" />
            No conversations found.
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === selectedId;
            const hasUnread = conv.unreadCount > 0;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv.id)}
                role="listitem"
                aria-selected={isSelected}
                className={`w-full p-3 sm:p-4 text-left flex items-start gap-3 transition-colors focus:outline-none ${
                  isSelected
                    ? 'bg-saffron-50/70'
                    : 'hover:bg-ink-50/80'
                }`}
              >
                {/* Avatar with indicator */}
                <div className="relative shrink-0">
                  {conv.participantAvatar ? (
                    <img
                      src={conv.participantAvatar}
                      alt={conv.participantName}
                      className="w-11 h-11 rounded-full object-cover border border-ink-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-saffron-100 text-saffron-700 flex items-center justify-center font-bold text-sm">
                      {conv.participantName.charAt(0)}
                    </div>
                  )}
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-hamplard-primary border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <h3
                      className={`text-sm truncate ${
                        hasUnread ? 'font-bold text-ink-900' : 'font-semibold text-ink-800'
                      }`}
                    >
                      {conv.participantName}
                    </h3>
                    <span className="text-[10px] text-ink-400 shrink-0">
                      {conv.lastMessage ? formatRelativeTime(conv.lastMessage.createdAt) : ''}
                    </span>
                  </div>

                  {conv.courseTitle && (
                    <p className="text-[11px] text-saffron-700 font-medium truncate flex items-center gap-1 mt-0.5">
                      <BookOpen className="w-3 h-3 shrink-0" />
                      {conv.courseTitle}
                    </p>
                  )}

                  <p
                    className={`text-xs truncate mt-1 ${
                      hasUnread ? 'font-semibold text-ink-900' : 'text-ink-500'
                    }`}
                  >
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>

                {/* Unread count pill */}
                {hasUnread && (
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-hamplard-primary text-white self-center">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
