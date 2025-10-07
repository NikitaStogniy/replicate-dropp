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

const MAX_HISTORY_ITEMS = 10; // Уменьшено с 20 для экономии localStorage
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
    // If storage is full, try progressively reducing items
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, reducing history...');

      // Попытка 1: оставить только последние 5 элементов
      let reducedItems = items.slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedItems));
        console.log('History reduced to 5 items');
        return;
      } catch (retryError) {
        console.warn('Still too large with 5 items, trying 3...');
      }

      // Попытка 2: оставить только последние 3 элемента
      reducedItems = items.slice(0, 3);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedItems));
        console.log('History reduced to 3 items');
        return;
      } catch (retryError2) {
        console.warn('Still too large with 3 items, clearing history...');
      }

      // Попытка 3: очистить всю историю
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        console.log('History cleared completely');
      } catch (finalError) {
        console.error('Failed to clear history, localStorage may be corrupted:', finalError);
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
