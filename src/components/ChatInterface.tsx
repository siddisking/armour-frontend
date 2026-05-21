import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Menu, Clapperboard } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { Sidebar } from './Sidebar';
import { useConversations } from '../hooks/useConversations';

export const ChatInterface: React.FC = () => {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    startNewConversation,
    addMessageToActive,
    deleteConversation,
  } = useConversations();

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addMessageToActive({
      role: 'user',
      content: inputValue,
    });
    
    const currentUserInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      addMessageToActive({
        role: 'ai',
        content: `I'm currently running in mock mode. Once the backend and vector DB are hooked up, I'll search my knowledge base for recommendations matching: "${currentUserInput}"`,
      });
      setIsLoading(false);
    }, 1500);
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
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>PlotArmor AI</h1>
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
