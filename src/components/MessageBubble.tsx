import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className="animate-slide-up"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        width: '100%',
      }}
    >
      {/* Avatar */}
      <div
        className="flex-center"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-full)',
          background: isUser ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
          flexShrink: 0,
        }}
      >
        {isUser ? <User size={20} color="var(--text-primary)" /> : <Bot size={20} color="white" />}
      </div>

      {/* Message Content */}
      <div
        className={isUser ? '' : 'glass-panel'}
        style={{
          maxWidth: '80%',
          padding: 'var(--space-md) var(--space-lg)',
          borderRadius: 'var(--radius-lg)',
          background: isUser ? 'var(--bg-tertiary)' : undefined,
          borderTopRightRadius: isUser ? '0' : 'var(--radius-lg)',
          borderTopLeftRadius: !isUser ? '0' : 'var(--radius-lg)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--text-primary)' }}>
          {message.content}
        </p>
        <span
          style={{
            display: 'block',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: 'var(--space-xs)',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
