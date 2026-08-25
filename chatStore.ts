import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface ChatState {
  sessionId?: string;
  messages: ChatMessage[];
  isSending: boolean;
  setSessionId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  appendToLastMessage: (token: string) => void;
  finishStreaming: () => void;
  setSending: (sending: boolean) => void;
  reset: () => void;
}

/**
 * Chat state lives in memory for the current app session, per the
 * product spec ("session remains in memory"). Full history can still
 * be re-fetched from the backend via GET /chat/sessions/:id/messages.
 */
export const useChatStore = create<ChatState>((set) => ({
  sessionId: undefined,
  messages: [],
  isSending: false,
  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  appendToLastMessage: (token) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + token };
      }
      return { messages };
    }),
  finishStreaming: () =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last) messages[messages.length - 1] = { ...last, isStreaming: false };
      return { messages };
    }),
  setSending: (isSending) => set({ isSending }),
  reset: () => set({ sessionId: undefined, messages: [], isSending: false }),
}));
