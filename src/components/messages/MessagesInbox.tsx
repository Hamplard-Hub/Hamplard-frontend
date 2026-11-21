'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { MessageComposer } from './MessageComposer';
import { messagesApi } from '@/lib/api/services';
import type { Conversation, DirectMessage, MessageAttachment } from '@/types';

export function MessagesInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const list = await messagesApi.getConversations();
      setConversations(list);
      // Auto-select first conversation on desktop if none selected
      if (!selectedId && list.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setSelectedId(list[0].id);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingConversations(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchConversations();

    const handleUpdate = () => {
      fetchConversations();
    };
    window.addEventListener('hamplard:messages-updated', handleUpdate);
    return () => window.removeEventListener('hamplard:messages-updated', handleUpdate);
  }, [fetchConversations]);

  // Load messages when selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    messagesApi
      .getMessages(selectedId)
      .then((thread) => {
        if (isMounted) {
          setMessages(thread);
          // Mark as read
          messagesApi.markAsRead(selectedId);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setShowThreadOnMobile(true);
  };

  const handleBackToConversations = () => {
    setShowThreadOnMobile(false);
  };

  const handleSendMessage = async (content: string, attachments: MessageAttachment[]) => {
    if (!selectedId) return;
    const sent = await messagesApi.sendMessage(selectedId, content, attachments);
    setMessages((prev) => [...prev, sent]);
    fetchConversations();
  };

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;

  return (
    <div className="card h-[calc(100vh-12rem)] min-h-[500px] flex overflow-hidden border border-ink-100 shadow-sm rounded-2xl bg-white">
      {/* Left Column: Conversation List */}
      <div
        className={`w-full lg:w-80 lg:shrink-0 h-full ${
          showThreadOnMobile ? 'hidden lg:block' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Right Column: Message Thread + Composer */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 ${
          showThreadOnMobile ? 'block' : 'hidden lg:flex'
        }`}
      >
        <div className="flex-1 overflow-hidden">
          <MessageThread
            conversation={selectedConversation}
            messages={messages}
            loading={loadingMessages}
            onBack={handleBackToConversations}
          />
        </div>

        {selectedConversation && (
          <MessageComposer onSendMessage={handleSendMessage} disabled={loadingMessages} />
        )}
      </div>
    </div>
  );
}

export default MessagesInbox;
