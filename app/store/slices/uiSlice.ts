import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isModelSelectorOpen: boolean;
  inpaintingMode: boolean;
  inpaintImage: string | null;
  maskImage: string | null;
  isDrawing: boolean;
  brushSize: number;
  showMaskEditor: boolean;
  maskPrompt: string;
}

const initialState: UiState = {
  isModelSelectorOpen: false,
  inpaintingMode: false,
  inpaintImage: null,
  maskImage: null,
  isDrawing: false,
  brushSize: 20,
  showMaskEditor: false,
  maskPrompt: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsModelSelectorOpen: (state, action: PayloadAction<boolean>) => {
      state.isModelSelectorOpen = action.payload;
    },
    toggleModelSelector: (state) => {
      state.isModelSelectorOpen = !state.isModelSelectorOpen;
    },
    setInpaintingMode: (state, action: PayloadAction<boolean>) => {
      state.inpaintingMode = action.payload;
    },
    setInpaintImage: (state, action: PayloadAction<string | null>) => {
      state.inpaintImage = action.payload;
    },
    setMaskImage: (state, action: PayloadAction<string | null>) => {
      state.maskImage = action.payload;
    },
    setIsDrawing: (state, action: PayloadAction<boolean>) => {
      state.isDrawing = action.payload;
    },
    setBrushSize: (state, action: PayloadAction<number>) => {
      state.brushSize = action.payload;
    },
    setShowMaskEditor: (state, action: PayloadAction<boolean>) => {
      state.showMaskEditor = action.payload;
    },
    setMaskPrompt: (state, action: PayloadAction<string>) => {
      state.maskPrompt = action.payload;
    },
    startInpainting: (state, action: PayloadAction<string>) => {
      state.inpaintImage = action.payload;
      state.inpaintingMode = true;
      state.maskImage = null;
      state.showMaskEditor = true;
    },
    exitInpainting: (state) => {
      state.inpaintingMode = false;
      state.inpaintImage = null;
      state.maskImage = null;
      state.maskPrompt = '';
    },
    resetUi: () => initialState,
  },
});

export const {
  setIsModelSelectorOpen,
  toggleModelSelector,
  setInpaintingMode,
  setInpaintImage,
  setMaskImage,
  setIsDrawing,
  setBrushSize,
  setShowMaskEditor,
  setMaskPrompt,
  startInpainting,
  exitInpainting,
  resetUi,
} = uiSlice.actions;

export default uiSlice.reducer;
