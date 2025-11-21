import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ImageValue } from '@/app/utils/fileConversion';

// Helper to get data URL from ImageValue
export function getImageDataUrl(imageValue: ImageValue): string {
  return imageValue.dataUrl;
}

// Helper to convert URL to ImageValue
export async function urlToImageValue(url: string): Promise<ImageValue> {
  // Fetch the image from the URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }

  // Get the blob
  const blob = await response.blob();

  // Convert blob to base64 dataUrl
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;

      // Extract filename from URL (last part after /)
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1] || 'auto-attached-image.png';

      // Create ImageValue
      const imageValue: ImageValue = {
        dataUrl,
        name: filename,
        type: blob.type || 'image/png',
      };

      resolve(imageValue);
    };
    reader.onerror = () => {
      reject(new Error('Failed to convert blob to data URL'));
    };
    reader.readAsDataURL(blob);
  });
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: number;
  content: {
    // User message fields
    prompt?: string;
    imageAttachments?: ImageValue[]; // Manually uploaded images
    autoAttachedImage?: ImageValue | null; // Auto-attached from previous generation (converted from URL)

    // Assistant message fields
    generatedImages?: string[]; // Result URLs (images or videos as data URLs)
    isVideo?: boolean; // True if content is video
    status?: 'processing' | 'succeeded' | 'failed';
    error?: string;
    seed?: number;

    // Common fields
    modelId?: string;
    modelName?: string;
    parameters?: Record<string, unknown>;
  };
}

interface ChatState {
  messages: ChatMessage[];
  currentInput: {
    prompt: string;
    imageAttachments: ImageValue[];
    autoAttachedImage: ImageValue | null;
    autoAttachDisabled: boolean;
  };
  isGenerating: boolean;
  maxMessages: number;
}

const MAX_CHAT_MESSAGES = 50;
const STORAGE_KEY = 'chat-messages';

// Load from localStorage
const loadMessagesFromStorage = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load chat from localStorage:', error);
    return [];
  }
};

// Save to localStorage
const saveMessagesToStorage = (messages: ChatMessage[]): void => {
  if (typeof window === 'undefined') return;

  try {
    // Only save last N messages to avoid quota issues
    const messagesToSave = messages.slice(-MAX_CHAT_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
  } catch (error) {
    console.error('Failed to save chat to localStorage:', error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, reducing chat history...');

      // Try saving only last 20 messages
      try {
        const reducedMessages = messages.slice(-20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedMessages));
        console.log('Chat reduced to 20 messages');
      } catch (retryError) {
        console.warn('Still too large, clearing chat history...');
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
    }
  }
};

const initialState: ChatState = {
  messages: [],
  currentInput: {
    prompt: '',
    imageAttachments: [],
    autoAttachedImage: null,
    autoAttachDisabled: false,
  },
  isGenerating: false,
  maxMessages: MAX_CHAT_MESSAGES,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Message management
    addUserMessage: (state, action: PayloadAction<Omit<ChatMessage, 'id' | 'type' | 'timestamp'>>) => {
      const message: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'user',
        timestamp: Date.now(),
        content: action.payload.content,
      };

      state.messages.push(message);

      // Keep only max messages
      if (state.messages.length > state.maxMessages) {
        state.messages = state.messages.slice(-state.maxMessages);
      }

      saveMessagesToStorage(state.messages);
    },

    addAssistantMessage: (
      state,
      action: PayloadAction<Omit<ChatMessage, 'type' | 'timestamp'> & { id?: string }>
    ) => {
      const message: ChatMessage = {
        id: action.payload.id || `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'assistant',
        timestamp: Date.now(),
        content: action.payload.content,
      };

      state.messages.push(message);

      if (state.messages.length > state.maxMessages) {
        state.messages = state.messages.slice(-state.maxMessages);
      }

      saveMessagesToStorage(state.messages);
    },

    addSystemMessage: (state, action: PayloadAction<{ text: string }>) => {
      const message: ChatMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        timestamp: Date.now(),
        content: {
          prompt: action.payload.text,
        },
      };

      state.messages.push(message);
      saveMessagesToStorage(state.messages);
    },

    updateAssistantMessage: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ChatMessage['content']> }>
    ) => {
      const message = state.messages.find((msg) => msg.id === action.payload.id);
      if (message && message.type === 'assistant') {
        message.content = { ...message.content, ...action.payload.updates };
        saveMessagesToStorage(state.messages);
      }
    },

    deleteMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter((msg) => msg.id !== action.payload);
      saveMessagesToStorage(state.messages);
    },

    clearMessages: (state) => {
      state.messages = [];
      saveMessagesToStorage([]);
    },

    loadMessages: (state) => {
      state.messages = loadMessagesFromStorage();
    },

    // Current input management
    setCurrentPrompt: (state, action: PayloadAction<string>) => {
      state.currentInput.prompt = action.payload;
    },

    addImageAttachment: (state, action: PayloadAction<ImageValue>) => {
      state.currentInput.imageAttachments.push(action.payload);
    },

    removeImageAttachment: (state, action: PayloadAction<number>) => {
      state.currentInput.imageAttachments.splice(action.payload, 1);
    },

    setAutoAttachedImage: (state, action: PayloadAction<ImageValue | null>) => {
      state.currentInput.autoAttachedImage = action.payload;
    },

    setAutoAttachDisabled: (state, action: PayloadAction<boolean>) => {
      state.currentInput.autoAttachDisabled = action.payload;
    },

    clearCurrentInput: (state) => {
      state.currentInput = {
        prompt: '',
        imageAttachments: [],
        autoAttachedImage: null,
        autoAttachDisabled: false,
      };
    },

    // Generation status
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
  },
});

export const {
  addUserMessage,
  addAssistantMessage,
  addSystemMessage,
  updateAssistantMessage,
  deleteMessage,
  clearMessages,
  loadMessages,
  setCurrentPrompt,
  addImageAttachment,
  removeImageAttachment,
  setAutoAttachedImage,
  setAutoAttachDisabled,
  clearCurrentInput,
  setGenerating,
} = chatSlice.actions;

export default chatSlice.reducer;
