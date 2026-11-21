'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, MessageSquare, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import type { Conversation, DirectMessage } from '@/types';

interface MessageThreadProps {
  conversation: Conversation | null;
  messages: DirectMessage[];
  loading?: boolean;
  onBack?: () => void;
  className?: string;
}

function formatMessageTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageThread({
  conversation,
  messages,
  loading = false,
  onBack,
  className = '',
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 text-center bg-ink-50/40 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-ink-800">Select a conversation</h3>
        <p className="text-xs text-ink-500 mt-1 max-w-sm">
          Choose an instructor thread from the left to view your message history or ask questions
          about your course coursework.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-ink-50/30 ${className}`}>
      {/* Thread Header */}
      <div className="p-3 sm:p-4 bg-white border-b border-ink-100 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 -ml-1 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors lg:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Instructor Avatar */}
          {conversation.participantAvatar ? (
            <img
              src={conversation.participantAvatar}
              alt={conversation.participantName}
              className="w-10 h-10 rounded-full object-cover border border-ink-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-saffron-100 text-saffron-700 flex items-center justify-center font-bold text-sm shrink-0">
              {conversation.participantName.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-ink-900 truncate">
                {conversation.participantName}
              </h3>
              <span className="text-[10px] font-semibold text-saffron-700 bg-saffron-50 px-1.5 py-0.5 rounded border border-saffron-200">
                Instructor
              </span>
            </div>

            {conversation.courseTitle && (
              <p className="text-xs text-ink-500 truncate flex items-center gap-1 mt-0.5">
                <BookOpen className="w-3 h-3 text-saffron-500 shrink-0" />
                {conversation.courseTitle}
              </p>
            )}
          </div>
        </div>

        {conversation.courseId && (
          <Link
            href={`/dashboard/courses/${conversation.courseId}/learn`}
            className="text-xs font-medium text-hamplard-primary hover:underline shrink-0 hidden sm:flex items-center gap-1"
          >
            Go to Course <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="space-y-4 py-8">
            <div className="flex gap-2 max-w-sm">
              <div className="w-8 h-8 rounded-full bg-ink-200 animate-pulse" />
              <div className="flex-1 h-16 bg-ink-200 rounded-2xl animate-pulse" />
            </div>
            <div className="flex gap-2 max-w-sm ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-ink-200 animate-pulse" />
              <div className="flex-1 h-12 bg-ink-200 rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-ink-400 text-xs">
            No messages yet. Send a note to begin the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderRole === 'STUDENT' || message.senderName === 'You';

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-saffron-100 text-saffron-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {conversation.participantName.charAt(0)}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 shadow-xs transition-all ${
                    isMe
                      ? 'bg-hamplard-primary text-white rounded-br-xs'
                      : 'bg-white border border-ink-100 text-ink-900 rounded-bl-xs'
                  }`}
                >
                  {/* Text content */}
                  {message.content && (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((att) => (
                        <div key={att.id} className="rounded-xl overflow-hidden">
                          {att.type.startsWith('image/') ? (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-xl border border-black/10"
                            >
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full max-h-60 object-cover hover:scale-102 transition-transform duration-200"
                              />
                            </a>
                          ) : (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-lg text-xs underline ${
                                isMe ? 'bg-white/10 text-white' : 'bg-ink-100 text-ink-800'
                              }`}
                            >
                              📎 {att.name}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message timestamp and read receipt */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                      isMe ? 'text-white/70' : 'text-ink-400'
                    }`}
                  >
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isMe && (
                      <CheckCheck className={`w-3.5 h-3.5 ${message.read ? 'text-leaf-300' : 'text-white/50'}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default MessageThread;
