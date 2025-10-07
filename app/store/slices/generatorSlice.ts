import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GenerationResult } from '../services/replicateApi';
import type { ImageValue } from '@/app/utils/fileConversion';

// Re-export ImageValue as ImageInputItem for backwards compatibility
export type ImageInputItem = ImageValue;

interface GeneratorState {
  // Universal parameters storage - all model parameters go here
  parameters: Record<string, unknown>;
  // Results cached by model ID
  resultsByModel: Record<string, GenerationResult>;
}

const initialState: GeneratorState = {
  parameters: {},
  resultsByModel: {},
};

const generatorSlice = createSlice({
  name: 'generator',
  initialState,
  reducers: {
    // Universal parameter actions
    setParameter: (state, action: PayloadAction<{ name: string; value: unknown }>) => {
      state.parameters[action.payload.name] = action.payload.value;
    },
    setParameters: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.parameters = action.payload;
    },
    clearParameters: (state) => {
      state.parameters = {};
    },
    setResult: (state, action: PayloadAction<{ modelId: string; result: GenerationResult }>) => {
      state.resultsByModel[action.payload.modelId] = action.payload.result;
    },
    resetGenerator: (state) => {
      state.parameters = {};
      state.resultsByModel = {};
    },
  },
});

export const {
  setParameter,
  setParameters,
  clearParameters,
  setResult,
  resetGenerator,
} = generatorSlice.actions;

export default generatorSlice.reducer;
