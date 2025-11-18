"use client";

import { useEffect } from "react";
import NewAuthGuard from "./components/NewAuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatInterface from "./containers/ChatInterface";
import { useAppDispatch } from "./store";
import { loadSelectedModelFromStorage } from "./store/slices/modelsSlice";

export default function Home() {
  const dispatch = useAppDispatch();

  // Load selected model from localStorage on mount
  useEffect(() => {
    dispatch(loadSelectedModelFromStorage());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <NewAuthGuard>
        <ChatInterface />
      </NewAuthGuard>
    </ErrorBoundary>
  );
}
