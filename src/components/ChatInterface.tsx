import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Menu, Clapperboard } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { Sidebar } from './Sidebar';
import { useConversations } from '../hooks/useConversations';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { SUPPORTED_MODELS, ModelId, MEDIA_TYPES, MediaType } from '../utils/constant';

export const ChatInterface: React.FC = () => {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    startNewConversation,
    addMessageToActive,
    updateLastMessage,
    updateConversationId,
    deleteConversation,
  } = useConversations();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });
  
  const isGeminiDisabled = import.meta.env.VITE_DISABLE_GEMINI === 'true';
  const [model] = useState<ModelId>(
    isGeminiDisabled ? SUPPORTED_MODELS.QWEN_7B : SUPPORTED_MODELS.GEMINI_FLASH
  );
  const [mediaType, setMediaType] = useState<MediaType>(MEDIA_TYPES.ANIME);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const currentUserInput = inputValue;
    const currentHistory = activeConversation?.messages || [];
    setInputValue('');
    setIsLoading(true);

    // Slice last 15 messages for history context payload
    const historyPayload = currentHistory
      .slice(-15)
      .map(m => ({ role: m.role, content: m.content }));

    // Capture the ID returned by addMessageToActive (which is the temporary ID or active ID)
    const activeId = addMessageToActive([
      { role: 'user', content: currentUserInput },
      { role: 'ai', content: '' } // Empty placeholder for streaming
    ]);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = sessionStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const bodyPayload: any = {
        message: currentUserInput,
        model: model,
        provider: model, // Backward compatibility fallback
        mediaType: mediaType,
      };

      if (token) {
        // If we are in an active conversation and it is a real DB UUID (contains a dash)
        const isTemporary = !activeId || !activeId.includes('-');
        if (activeId && !isTemporary) {
          bodyPayload.chatId = activeId;
        }
      } else {
        bodyPayload.history = historyPayload;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if server returned a real conversation ID header
      const serverChatId = response.headers.get('X-Chat-Id');
      if (token && serverChatId && activeId) {
        const isTemporary = !activeId.includes('-');
        if (isTemporary) {
          updateConversationId(activeId, serverChatId);
        }
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
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
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div 
        className="sidebar-backdrop"
        onClick={() => setIsSidebarOpen(false)}
      />
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={(id) => {
          setActiveConversationId(id);
          if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
          }
        }}
        onNew={() => {
          startNewConversation();
          if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
          }
        }}
        onDelete={deleteConversation}
      />

      <div className="chat-main">
        {/* Header */}
        <header className="chat-header">
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
          <div className="header-title-wrapper">
            <div className="flex-center" style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
            }}>
              <Bot size={20} color="white" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>PlotArmor AI</h1>
          </div>

          <div className="header-model-selector" style={{ display: 'flex', gap: '0.5rem' }}>

            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as any)}
              disabled={isLoading}
              className="model-select-dropdown"
            >
              <option value={MEDIA_TYPES.ANIME}>🎬 Anime</option>
              <option value={MEDIA_TYPES.MOVIES}>🎥 Movies</option>
            </select>
          </div>

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
                <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '2rem' }}>PlotArmor AI</h2>
                <p style={{ maxWidth: '400px', fontSize: '1.1rem' }}>
                  Ask PlotArmor anything about anime/movies/series
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
        <footer className="chat-footer">
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
