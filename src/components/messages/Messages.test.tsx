import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { MessageComposer } from './MessageComposer';
import type { Conversation, DirectMessage } from '@/types';

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participantId: 'inst-1',
    participantName: 'Amina Adeleke',
    participantRole: 'INSTRUCTOR',
    courseId: '1',
    courseTitle: 'Modern Tailoring',
    lastMessage: {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'inst-1',
      senderName: 'Amina Adeleke',
      senderRole: 'INSTRUCTOR',
      content: 'Your French seam looks great!',
      createdAt: new Date().toISOString(),
      read: false,
    },
    unreadCount: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conv-2',
    participantId: 'inst-2',
    participantName: 'Chidi Okafor',
    participantRole: 'INSTRUCTOR',
    courseId: '2',
    courseTitle: 'Bridal Makeup',
    lastMessage: {
      id: 'msg-2',
      conversationId: 'conv-2',
      senderId: 'inst-2',
      senderName: 'Chidi Okafor',
      senderRole: 'INSTRUCTOR',
      content: 'Let me know how the contouring goes.',
      createdAt: new Date().toISOString(),
      read: true,
    },
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  },
];

const mockMessages: DirectMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'student-1',
    senderName: 'You',
    senderRole: 'STUDENT',
    content: 'Hello instructor! Here is my seam work.',
    attachments: [
      {
        id: 'att-1',
        name: 'seam.jpg',
        url: 'https://example.com/seam.jpg',
        type: 'image/jpeg',
      },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: true,
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'inst-1',
    senderName: 'Amina Adeleke',
    senderRole: 'INSTRUCTOR',
    content: 'Your French seam looks great!',
    createdAt: new Date().toISOString(),
    read: true,
  },
];

describe('ConversationList Component', () => {
  it('renders conversations with names, course titles, and unread badges', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        selectedId={null}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Amina Adeleke')).toBeInTheDocument();
    expect(screen.getByText('Modern Tailoring')).toBeInTheDocument();
    expect(screen.getByText('Your French seam looks great!')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Unread badge
    expect(screen.getByText('Chidi Okafor')).toBeInTheDocument();
  });

  it('filters conversations based on search query', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        selectedId={null}
        onSelect={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search instructors or courses/i);
    fireEvent.change(searchInput, { target: { value: 'Bridal' } });

    expect(screen.queryByText('Amina Adeleke')).not.toBeInTheDocument();
    expect(screen.getByText('Chidi Okafor')).toBeInTheDocument();
  });

  it('calls onSelect when clicking a conversation', () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={mockConversations}
        selectedId={null}
        onSelect={onSelect}
      />
    );

    const convItem = screen.getByText('Amina Adeleke');
    fireEvent.click(convItem);

    expect(onSelect).toHaveBeenCalledWith('conv-1');
  });
});

describe('MessageThread Component', () => {
  it('renders empty selection state when no conversation is selected', () => {
    render(<MessageThread conversation={null} messages={[]} />);
    expect(screen.getByText('Select a conversation')).toBeInTheDocument();
  });

  it('renders thread header and message bubbles with attachments', () => {
    // scrollIntoView mock for jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    render(
      <MessageThread
        conversation={mockConversations[0]}
        messages={mockMessages}
      />
    );

    expect(screen.getByText('Amina Adeleke')).toBeInTheDocument();
    expect(screen.getByText('Modern Tailoring')).toBeInTheDocument();
    expect(screen.getByText('Hello instructor! Here is my seam work.')).toBeInTheDocument();
    expect(screen.getByText('Your French seam looks great!')).toBeInTheDocument();
    expect(screen.getByAltText('seam.jpg')).toBeInTheDocument();
  });
});

describe('MessageComposer Component', () => {
  it('submits text message and clears composer input', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn().mockResolvedValue(undefined);

    render(<MessageComposer onSendMessage={onSendMessage} />);

    const textarea = screen.getByPlaceholderText(/Type your message to instructor/i);
    await user.type(textarea, 'Can you review lesson 4?');

    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    await user.click(sendBtn);

    expect(onSendMessage).toHaveBeenCalledWith('Can you review lesson 4?', []);
    expect(textarea).toHaveValue('');
  });
});
