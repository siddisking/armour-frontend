import React from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ conversations, activeId, onSelect, onNew, onDelete }) => {
  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{ padding: 'var(--space-md)' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            justifyContent: 'flex-start',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 var(--space-sm)',
      }}>
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <div
              key={conv.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                marginBottom: 'var(--space-xs)',
              }}
            >
              <button
                onClick={() => onSelect(conv.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-md)',
                  backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minWidth: 0, // important for text overflow in flex
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MessageSquare size={16} style={{ flexShrink: 0 }} />
                <div style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {conv.title}
                </div>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                style={{
                  padding: 'var(--space-sm)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444'; // red-500
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                title="Delete conversation"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
