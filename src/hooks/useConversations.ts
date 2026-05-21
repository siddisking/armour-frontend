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

  const addMessageToActive = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };

    if (!activeConversationId) {
      // Creating a brand new conversation
      const newTitle = message.role === 'user' 
        ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
        : 'New Conversation';

      const newConv: Conversation = {
        id: Date.now().toString(),
        title: newTitle,
        messages: [newMessage],
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
              messages: [...conv.messages, newMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      );
    }
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
    deleteConversation,
  };
};
