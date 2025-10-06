import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GenerationResult } from '../services/replicateApi';

export interface ImageInputItem {
  dataUrl: string;
  name: string;
  type: string;
}

interface GeneratorState {
  prompt: string;
  characterImage: File | null;
  imageInputs: ImageInputItem[];
  styleType: string;
  aspectRatio: string;
  seed: string;
  resultsByModel: Record<string, GenerationResult>;
  // Video-specific parameters
  duration: number;
  resolution: string;
  promptOptimizer: boolean;
  firstFrameImage: File | null;
  lastFrameImage: File | null;
}

const initialState: GeneratorState = {
  prompt: '',
  characterImage: null,
  imageInputs: [],
  styleType: 'Auto',
  aspectRatio: '1:1',
  seed: '',
  resultsByModel: {},
  // Video-specific initial values
  duration: 6,
  resolution: '1080p',
  promptOptimizer: true,
  firstFrameImage: null,
  lastFrameImage: null,
};

const generatorSlice = createSlice({
  name: 'generator',
  initialState,
  reducers: {
    setPrompt: (state, action: PayloadAction<string>) => {
      state.prompt = action.payload;
    },
    setCharacterImage: (state, action: PayloadAction<File | null>) => {
      state.characterImage = action.payload;
    },
    setImageInputs: (state, action: PayloadAction<ImageInputItem[]>) => {
      state.imageInputs = action.payload;
    },
    setStyleType: (state, action: PayloadAction<string>) => {
      state.styleType = action.payload;
    },
    setAspectRatio: (state, action: PayloadAction<string>) => {
      state.aspectRatio = action.payload;
    },
    setSeed: (state, action: PayloadAction<string>) => {
      state.seed = action.payload;
    },
    setResult: (state, action: PayloadAction<{ modelId: string; result: GenerationResult }>) => {
      state.resultsByModel[action.payload.modelId] = action.payload.result;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setResolution: (state, action: PayloadAction<string>) => {
      state.resolution = action.payload;
    },
    setPromptOptimizer: (state, action: PayloadAction<boolean>) => {
      state.promptOptimizer = action.payload;
    },
    setFirstFrameImage: (state, action: PayloadAction<File | null>) => {
      state.firstFrameImage = action.payload;
    },
    setLastFrameImage: (state, action: PayloadAction<File | null>) => {
      state.lastFrameImage = action.payload;
    },
    resetGenerator: (state) => {
      state.prompt = '';
      state.characterImage = null;
      state.imageInputs = [];
      state.seed = '';
      state.resultsByModel = {};
      state.firstFrameImage = null;
      state.lastFrameImage = null;
    },
  },
});

export const {
  setPrompt,
  setCharacterImage,
  setImageInputs,
  setStyleType,
  setAspectRatio,
  setSeed,
  setResult,
  setDuration,
  setResolution,
  setPromptOptimizer,
  setFirstFrameImage,
  setLastFrameImage,
  resetGenerator,
} = generatorSlice.actions;

export default generatorSlice.reducer;
