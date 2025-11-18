'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/app/store/slices/chatSlice';
import type { DynamicRowHeight } from 'react-window';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';

interface MessageRowProps {
  index: number;
  messages: ChatMessage[];
  dynamicRowHeight: DynamicRowHeight;
}

const MessageRow = ({ index, messages, dynamicRowHeight }: MessageRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const message = messages[index];

  useEffect(() => {
    if (!rowRef.current) return;

    // Observe row element for size changes
    const cleanup = dynamicRowHeight.observeRowElements([rowRef.current]);

    return cleanup;
  }, [dynamicRowHeight, message]);

  return (
    <div ref={rowRef} className="px-4 py-2">
      {message.type === 'user' && <UserMessage message={message} />}
      {message.type === 'assistant' && <AssistantMessage message={message} />}
      {message.type === 'system' && (
        <div className="flex justify-center my-2">
          <div className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
            {message.content.prompt}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageRow;
