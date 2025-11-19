"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { clearMessages, setCurrentPrompt } from "../store/slices/chatSlice";
import { useChatGeneration } from "../hooks/useChatGeneration";
import ChatTimeline from "../components/Chat/ChatTimeline";
import ChatInput from "../components/Chat/ChatInput";
import ModelSelectorInline from "../components/Chat/ModelSelectorInline";
import AdvancedOptions from "../components/Chat/AdvancedOptions";
import Sidebar from "../components/Chat/Sidebar";
import {
  loadSessions,
  updateSessionMessages,
  addUserMessage as addSessionUserMessage,
  addAssistantMessage as addSessionAssistantMessage,
} from "../store/slices/sessionsSlice";
import * as chatSliceActions from "../store/slices/chatSlice";

const ChatInterface = () => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [timelineHeight, setTimelineHeight] = useState(600);

  const { messages: chatMessages, isGenerating } = useAppSelector(
    (state) => state.chat
  );
  const { currentSessionId, sessions } = useAppSelector(
    (state) => state.sessions
  );
  const { handleSend } = useChatGeneration();

  // Load sessions on mount
  useEffect(() => {
    dispatch(loadSessions());
    dispatch(clearMessages());
  }, [dispatch]);

  // Get current session's messages
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const sessionMessages = currentSession?.messages || [];

  // Sync chat messages to current session
  useEffect(() => {
    if (currentSessionId && chatMessages.length >= 0) {
      dispatch(
        updateSessionMessages({
          sessionId: currentSessionId,
          messages: chatMessages,
        })
      );
    }
  }, [chatMessages, currentSessionId, dispatch]);

  // Calculate timeline height based on container size
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerHeight = container.clientHeight;
        // Header is ~76px, fixed bottom section is ~180-200px
        // Reserve total of ~280px for header and input
        const calculatedHeight = containerHeight - 280;
        setTimelineHeight(Math.max(300, calculatedHeight));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div ref={containerRef} className="flex h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Timeline - constrained to available space */}
        <div className="flex-1 overflow-hidden">
          <ChatTimeline messages={sessionMessages} height={timelineHeight} />
        </div>

        {/* Fixed Bottom Section: Model Selector + Advanced Options + Input */}
        <div className="fixed bottom-0 right-0 left-64 bg-[#0a0a0a] border-t border-gray-800">
          {/* Model Selector */}
          <div className="px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-gray-400">Model:</span>
            <ModelSelectorInline />
          </div>

          {/* Advanced Options */}
          <AdvancedOptions />

          {/* Chat Input */}
          <ChatInput onSend={handleSend} isGenerating={isGenerating} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
