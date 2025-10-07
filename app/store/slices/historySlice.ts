import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GenerationResult } from '../services/replicateApi';

export interface HistoryItem {
  id: string;
  timestamp: number;
  modelId: string;
  modelName: string;
  parameters: Record<string, unknown>;
  result: GenerationResult;
  // Store image as base64 to save in localStorage
  imageBase64?: string;
  // For video results, store URL (won't be in localStorage)
  isVideo?: boolean;
}

interface HistoryState {
  items: HistoryItem[];
  maxItems: number;
  isOpen: boolean;
}

const MAX_HISTORY_ITEMS = 20;
const STORAGE_KEY = 'generation-history';

// Load from localStorage
const loadHistoryFromStorage = (): HistoryItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
    return [];
  }
};

// Save to localStorage
const saveHistoryToStorage = (items: HistoryItem[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
    // If storage is full, try removing oldest items
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      const reducedItems = items.slice(-Math.floor(MAX_HISTORY_ITEMS / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedItems));
      } catch (retryError) {
        console.error('Failed to save even after reducing items:', retryError);
      }
    }
  }
};

const initialState: HistoryState = {
  items: [],
  maxItems: MAX_HISTORY_ITEMS,
  isOpen: false,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addHistoryItem: (state, action: PayloadAction<HistoryItem>) => {
      // Add to beginning
      state.items.unshift(action.payload);

      // Keep only max items
      if (state.items.length > state.maxItems) {
        state.items = state.items.slice(0, state.maxItems);
      }

      // Save to localStorage
      saveHistoryToStorage(state.items);
    },

    deleteHistoryItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveHistoryToStorage(state.items);
    },

    clearHistory: (state) => {
      state.items = [];
      saveHistoryToStorage([]);
    },

    loadHistory: (state) => {
      state.items = loadHistoryFromStorage();
    },

    toggleHistory: (state) => {
      state.isOpen = !state.isOpen;
    },

    setHistoryOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const {
  addHistoryItem,
  deleteHistoryItem,
  clearHistory,
  loadHistory,
  toggleHistory,
  setHistoryOpen,
} = historySlice.actions;

export default historySlice.reducer;
