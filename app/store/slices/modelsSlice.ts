import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAllModels } from '@/app/lib/models';

interface ModelsState {
  selectedModelId: string;
}

const initialState: ModelsState = {
  selectedModelId: 'ideogram-v3-turbo',
};

const modelsSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModelId = action.payload;
      // Синхронизация с localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedModel', action.payload);
      }
    },
    loadSelectedModelFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        const savedModel = localStorage.getItem('selectedModel');
        if (savedModel && getAllModels().some(model => model.id === savedModel)) {
          state.selectedModelId = savedModel;
        }
      }
    },
  },
});

export const { setSelectedModel, loadSelectedModelFromStorage } = modelsSlice.actions;

export default modelsSlice.reducer;
