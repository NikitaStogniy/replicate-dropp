import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { ChatMessage } from './chatSlice';

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

interface SessionsState {
  sessions: Session[];
  currentSessionId: string | null;
}

const SESSIONS_STORAGE_KEY = 'chat-sessions';

// Load sessions from localStorage
const loadSessionsFromStorage = (): SessionsState => {
  if (typeof window === 'undefined') {
    return { sessions: [], currentSessionId: null };
  }

  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!stored) {
      // Create default session
      const defaultSession: Session = {
        id: nanoid(),
        name: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      return { sessions: [defaultSession], currentSessionId: defaultSession.id };
    }

    const parsed = JSON.parse(stored);
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      currentSessionId: parsed.currentSessionId || (parsed.sessions?.[0]?.id || null),
    };
  } catch (error) {
    console.error('Failed to load sessions from localStorage:', error);
    const defaultSession: Session = {
      id: nanoid(),
      name: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    return { sessions: [defaultSession], currentSessionId: defaultSession.id };
  }
};

// Save sessions to localStorage
const saveSessionsToStorage = (state: SessionsState) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
  }
};

const initialState: SessionsState = loadSessionsFromStorage();

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    // Create new session
    createSession: (state) => {
      const newSession: Session = {
        id: nanoid(),
        name: `Chat ${state.sessions.length + 1}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      state.sessions.push(newSession);
      state.currentSessionId = newSession.id;
      saveSessionsToStorage(state);
    },

    // Switch to session
    switchSession: (state, action: PayloadAction<string>) => {
      if (state.sessions.find((s) => s.id === action.payload)) {
        state.currentSessionId = action.payload;
        saveSessionsToStorage(state);
      }
    },

    // Delete session
    deleteSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s) => s.id !== action.payload);

      // If deleted session was current, switch to another
      if (state.currentSessionId === action.payload) {
        state.currentSessionId = state.sessions[0]?.id || null;
        if (!state.currentSessionId && state.sessions.length === 0) {
          const newSession: Session = {
            id: nanoid(),
            name: 'New Chat',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
          };
          state.sessions.push(newSession);
          state.currentSessionId = newSession.id;
        }
      }
      saveSessionsToStorage(state);
    },

    // Rename session
    renameSession: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const session = state.sessions.find((s) => s.id === action.payload.id);
      if (session) {
        session.name = action.payload.name;
        session.updatedAt = Date.now();
        saveSessionsToStorage(state);
      }
    },

    // Update session messages
    updateSessionMessages: (
      state,
      action: PayloadAction<{ sessionId: string; messages: ChatMessage[] }>
    ) => {
      const session = state.sessions.find((s) => s.id === action.payload.sessionId);
      if (session) {
        session.messages = action.payload.messages;
        session.updatedAt = Date.now();
        saveSessionsToStorage(state);
      }
    },

    // Clear current session
    clearCurrentSession: (state) => {
      if (state.currentSessionId) {
        const session = state.sessions.find((s) => s.id === state.currentSessionId);
        if (session) {
          session.messages = [];
          session.updatedAt = Date.now();
          saveSessionsToStorage(state);
        }
      }
    },

    // Add user message to current session
    addUserMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (state.currentSessionId) {
        const session = state.sessions.find((s) => s.id === state.currentSessionId);
        if (session) {
          session.messages.push(action.payload);
          session.updatedAt = Date.now();
          saveSessionsToStorage(state);
        }
      }
    },

    // Add assistant message to current session
    addAssistantMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (state.currentSessionId) {
        const session = state.sessions.find((s) => s.id === state.currentSessionId);
        if (session) {
          session.messages.push(action.payload);
          session.updatedAt = Date.now();
          saveSessionsToStorage(state);
        }
      }
    },

    // Load sessions from storage
    loadSessions: (state) => {
      const loaded = loadSessionsFromStorage();
      state.sessions = loaded.sessions;
      state.currentSessionId = loaded.currentSessionId;
    },
  },
});

export const {
  createSession,
  switchSession,
  deleteSession,
  renameSession,
  updateSessionMessages,
  clearCurrentSession,
  loadSessions,
  addUserMessage,
  addAssistantMessage,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;
