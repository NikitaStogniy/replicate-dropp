import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { replicateApi } from './services/replicateApi';
import generatorReducer from './slices/generatorSlice';
import uiReducer from './slices/uiSlice';
import modelsReducer from './slices/modelsSlice';

export const store = configureStore({
  reducer: {
    [replicateApi.reducerPath]: replicateApi.reducer,
    generator: generatorReducer,
    ui: uiReducer,
    models: modelsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(replicateApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Типизированные хуки
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
