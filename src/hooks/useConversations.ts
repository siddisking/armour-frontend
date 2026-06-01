import { useState, useEffect } from 'react';
import { Conversation, Message } from '../types';
import { API_BASE_URL } from '../config';

const STORAGE_KEY = 'plotarmor_conversations';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Load initial conversations on mount
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      // Load from server
      const fetchConversations = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/conversations`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const formatted = data.map((chat: any) => ({
              id: chat.id,
              title: chat.title,
              messages: [],
              updatedAt: new Date(chat.updated_at || chat.updatedAt),
            }));
            setConversations(formatted);
          }
        } catch (e) {
          console.error('Failed to fetch user conversations', e);
        }
      };
      fetchConversations();
    } else {
      // Load from local storage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const validConvs = parsed.filter(
            (conv: any) => conv.title !== 'New Conversation' && conv.title !== 'New Convrsation'
          );
          
          if (validConvs.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validConvs));
          }

          setConversations(
            validConvs.map((conv: any) => ({
              ...conv,
              updatedAt: new Date(conv.updatedAt),
              messages: conv.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
            }))
          );
        } catch (e) {
          console.error('Failed to parse conversations from local storage', e);
        }
      }
    }
  }, []);

  // Sync to local storage only if guest
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token && conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Load message history on-demand when activeConversationId changes (for members)
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token || !activeConversationId) return;

    // Check if messages are already loaded
    const current = conversations.find((c) => c.id === activeConversationId);
    if (current && current.messages.length > 0) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${activeConversationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content,
            timestamp: new Date(msg.created_at || msg.timestamp),
          }));

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return {
                  ...c,
                  messages: formattedMessages,
                };
              }
              return c;
            })
          );
        }
      } catch (e) {
        console.error('Failed to fetch conversation history', e);
      }
    };

    fetchMessages();
  }, [activeConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const startNewConversation = () => {
    setActiveConversationId(null);
  };

  const addMessageToActive = (message: Omit<Message, 'id' | 'timestamp'> | Omit<Message, 'id' | 'timestamp'>[]) => {
    const messagesArray = Array.isArray(message) ? message : [message];
    const newMessages: Message[] = messagesArray.map(m => ({
      ...m,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: new Date(),
    }));

    if (!activeConversationId) {
      // Creating a brand new conversation
      const firstUserMessage = messagesArray.find(m => m.role === 'user');
      const newTitle = firstUserMessage 
        ? firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '')
        : 'New Conversation';

      const newConv: Conversation = {
        id: Date.now().toString(),
        title: newTitle,
        messages: newMessages,
        updatedAt: new Date(),
      };
      
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      return newConv.id;
    } else {
      // Updating existing conversation
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, ...newMessages],
              updatedAt: new Date(),
            };
          }
          return conv;
        }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      );
      return activeConversationId;
    }
  };

  const updateLastMessage = (content: string) => {
    setConversations((prev) => {
      if (prev.length === 0) return prev;
      const sortedConvs = [...prev].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      const mostRecentConvId = sortedConvs[0].id;

      return prev.map((conv) => {
        if (conv.id === mostRecentConvId && conv.messages.length > 0) {
          const lastIndex = conv.messages.length - 1;
          const updatedMessages = [...conv.messages];
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            content: updatedMessages[lastIndex].content + content,
          };
          return {
            ...conv,
            messages: updatedMessages,
          };
        }
        return conv;
      });
    });
  };

  const updateConversationId = (tempId: string, realId: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === tempId) {
          return {
            ...conv,
            id: realId,
          };
        }
        return conv;
      })
    );
    setActiveConversationId(realId);
  };

  const renameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === id) {
          return {
            ...conv,
            title: newTitle,
            updatedAt: new Date(),
          };
        }
        return conv;
      })
    );

    const token = sessionStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      }).catch((e) => console.error('Failed to rename on server:', e));
    }
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }

    const token = sessionStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch((e) => console.error('Failed to delete on server:', e));
    }
  };

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    startNewConversation,
    addMessageToActive,
    updateLastMessage,
    updateConversationId,
    renameConversation,
    deleteConversation,
  };
};
