import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Menu, Clapperboard } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { Sidebar } from './Sidebar';
import { useConversations } from '../hooks/useConversations';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const ChatInterface: React.FC = () => {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    startNewConversation,
    addMessageToActive,
    updateLastMessage,
    deleteConversation,
  } = useConversations();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const currentUserInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    addMessageToActive([
      { role: 'user', content: currentUserInput },
      { role: 'ai', content: '' } // Empty placeholder for streaming
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentUserInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        // Assuming updateLastMessage hook exists
        if (text) {
          updateLastMessage(text);
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      updateLastMessage(`\n\n**Error:** Could not fetch response. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {isSidebarOpen && (
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onNew={startNewConversation}
          onDelete={deleteConversation}
        />
      )}

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        height: '100%',
        position: 'relative',
      }}>
        {/* Header */}
        <header style={{
          padding: 'var(--space-md) var(--space-xl)',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          zIndex: 10,
        }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              padding: 'var(--space-xs)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <Menu size={24} />
          </button>
          <div className="flex-center" style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
          }}>
            <Bot size={20} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', flex: 1 }}>PlotArmor AI</h1>

          {/* Authentication Status */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Hi, {user.name}
              </span>
              {user.role === 'SuperAdmin' && (
                <button
                  onClick={() => navigate('/admin')}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    background: 'linear-gradient(135deg, var(--accent-primary), #ff7b9c)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    boxShadow: '0 2px 10px rgba(255, 61, 113, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.9rem'
              }}
            >
              Sign In
            </button>
          )}
        </header>

        {/* Messages or Empty State */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-xl) 0',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div className="layout-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Empty State / Welcome Screen */}
            {!activeConversation && (
              <div className="flex-center animate-slide-up" style={{ 
                flexDirection: 'column', 
                flex: 1, 
                gap: 'var(--space-md)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-md)'
                }}>
                  <Clapperboard size={40} color="var(--accent-primary)" />
                </div>
                <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>What should we watch next?</h2>
                <p style={{ maxWidth: '400px' }}>
                  Ask PlotArmor AI for anime, movies, or TV series recommendations. Try describing a genre, plot, or specific trope.
                </p>
              </div>
            )}

            {/* Active Chat Messages */}
            {activeConversation?.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="animate-slide-up flex-center" style={{ 
                justifyContent: 'flex-start', 
                gap: 'var(--space-sm)',
                color: 'var(--text-secondary)'
              }}>
                <Sparkles size={16} className="animate-pulse" />
                <span style={{ fontSize: '0.9rem' }}>PlotArmor is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Footer */}
        <footer style={{
          padding: 'var(--space-md) var(--space-xl)',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
        }}>
          <div className="layout-container">
            <form 
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                position: 'relative',
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask for a recommendation..."
                style={{
                  flex: 1,
                  paddingRight: '3rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                }}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="flex-center"
                style={{
                  position: 'absolute',
                  right: 'var(--space-sm)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: inputValue.trim() ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  padding: 'var(--space-xs)',
                  cursor: (!inputValue.trim() || isLoading) ? 'default' : 'pointer',
                }}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
};
