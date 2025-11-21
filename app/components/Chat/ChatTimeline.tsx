'use client';

import { useEffect, useMemo } from 'react';
import { List, useDynamicRowHeight, useListRef } from 'react-window';
import type { ChatMessage } from '@/app/store/slices/chatSlice';
import MessageRow, { type MessageRowCustomProps } from './MessageRow';

interface ChatTimelineProps {
  messages: ChatMessage[];
  height: number;
}

const ChatTimeline = ({ messages, height }: ChatTimelineProps) => {
  const listRef = useListRef(null);
  const dynamicRowHeight = useDynamicRowHeight({ defaultRowHeight: 150 });

  // Reset scroll position when messages are cleared
  useEffect(() => {
    if (messages.length === 0 && listRef.current) {
      // Reset to top when messages are cleared
      listRef.current.scrollToRow({ index: 0, align: 'start' });
    }
  }, [messages.length === 0]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      setTimeout(() => {
        listRef.current?.scrollToRow({
          index: messages.length - 1,
          align: 'end',
        });
      }, 100);
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-gray-500"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium text-gray-300">Start a conversation</p>
          <p className="text-sm mt-2 text-gray-500">Type a prompt below to generate your first image</p>
        </div>
      </div>
    );
  }

  // Create a key that changes when we transition between empty and non-empty states
  // This forces React to remount the List component and reset its internal state
  const listKey = messages.length === 0 ? 'empty' : 'has-messages';

  return (
    <List<MessageRowCustomProps>
      key={listKey}
      listRef={listRef}
      defaultHeight={height}
      rowCount={messages.length}
      rowHeight={dynamicRowHeight}
      rowComponent={MessageRow}
      rowProps={{ messages, dynamicRowHeight }}
      className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent pb-[200px]"
    />
  );
};

export default ChatTimeline;
