'use client';

import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, X, Paperclip } from 'lucide-react';
import type { MessageAttachment } from '@/types';

interface MessageComposerProps {
  onSendMessage: (content: string, attachments: MessageAttachment[]) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSendMessage, disabled = false }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Create local object URL for preview
      const objectUrl = URL.createObjectURL(file);
      const newAttachment: MessageAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        url: objectUrl,
        type: file.type,
        size: file.size,
      };
      setAttachments((prev) => [...prev, newAttachment]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = content.trim();
    if ((!trimmed && attachments.length === 0) || isSending || disabled) return;

    try {
      setIsSending(true);
      await onSendMessage(trimmed, attachments);
      setContent('');
      setAttachments([]);
    } catch {
      // Error handling
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-ink-100">
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group flex items-center gap-2 p-1.5 pr-2 bg-ink-50 border border-ink-200 rounded-lg text-xs text-ink-700"
            >
              {att.type.startsWith('image/') ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-10 h-10 object-cover rounded-md"
                />
              ) : (
                <Paperclip className="w-4 h-4 text-ink-500" />
              )}
              <span className="max-w-[120px] truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(att.id)}
                className="p-1 rounded-full hover:bg-ink-200 text-ink-400 hover:text-ink-700 transition-colors"
                aria-label={`Remove attachment ${att.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input controls row */}
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          multiple
          className="hidden"
          id="message-attachment-input"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="p-2.5 rounded-xl text-ink-500 hover:text-hamplard-primary hover:bg-ink-50 transition-colors disabled:opacity-50"
          aria-label="Attach image or file"
          title="Attach image"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message to instructor... (Shift+Enter for newline)"
            rows={1}
            disabled={disabled || isSending}
            className="w-full px-3.5 py-2 text-sm bg-ink-50/80 hover:bg-ink-50 focus:bg-white border border-ink-200 focus:border-hamplard-primary rounded-xl focus:outline-none focus:ring-1 focus:ring-hamplard-primary resize-none min-h-[42px] max-h-32 transition-colors placeholder:text-ink-400"
            style={{ height: 'auto' }}
          />
        </div>

        <button
          type="submit"
          disabled={(!content.trim() && attachments.length === 0) || isSending || disabled}
          className="p-2.5 rounded-xl bg-hamplard-primary text-white hover:bg-hamplard-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0 flex items-center justify-center"
          aria-label="Send message"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

export default MessageComposer;
