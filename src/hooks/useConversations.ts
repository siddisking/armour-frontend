import { useState, useEffect } from 'react';
import { Conversation, Message } from '../types';

const STORAGE_KEY = 'plotarmor_conversations';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force filter out ANY conversation literally titled "New Conversation"
        // in case they had multiple messages or weird states from before.
        const validConvs = parsed.filter(
          (conv: any) => conv.title !== 'New Conversation' && conv.title !== 'New Convrsation'
        );
        
        // If we filtered some out, immediately sync the cleaned version to local storage
        if (validConvs.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validConvs));
        }

        return validConvs.map((conv: any) => ({
          ...conv,
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      } catch (e) {
        console.error('Failed to parse conversations from local storage', e);
        return [];
      }
    }
    return [];
  });

  // null implies a "New, empty conversation" screen
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

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
    }
  };

  const updateLastMessage = (content: string) => {
    setConversations((prev) => {
      // Find the most recently updated conversation to avoid closure staleness
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

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
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
    deleteConversation,
  };
};
