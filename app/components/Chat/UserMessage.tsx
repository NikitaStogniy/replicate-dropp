'use client';

import type { ChatMessage } from '@/app/store/slices/chatSlice';
import { getImageDataUrl } from '@/app/store/slices/chatSlice';
import { User } from 'lucide-react';

interface UserMessageProps {
  message: ChatMessage;
}

const UserMessage = ({ message }: UserMessageProps) => {
  const { prompt, imageAttachments, autoAttachedImage, modelName } = message.content;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[70%]">
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
        </div>

        <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3">
          {prompt && <p className="text-sm whitespace-pre-wrap break-words">{prompt}</p>}

          {modelName && (
            <div className="mt-2 pt-2 border-t border-blue-400 text-xs opacity-80">
              Model: {modelName}
            </div>
          )}
        </div>

        {/* Auto-attached image (from previous generation) */}
        {autoAttachedImage && (
          <div className="mt-2 p-2 bg-blue-900/30 border-2 border-blue-500 rounded-lg">
            <div className="text-xs text-blue-300 font-medium mb-1 flex items-center gap-1">
              <span>🔗</span>
              <span>Context from previous generation</span>
            </div>
            <img
              src={getImageDataUrl(autoAttachedImage)}
              alt="Auto-attached from previous generation"
              className="w-full rounded-md"
              loading="lazy"
            />
          </div>
        )}

        {/* Manually uploaded images */}
        {imageAttachments && imageAttachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {imageAttachments.map((img, idx) => {
              const imgUrl = getImageDataUrl(img);
              return (
                <div key={idx} className="p-2 bg-green-900/30 border-2 border-green-500 rounded-lg">
                  <div className="text-xs text-green-300 font-medium mb-1 flex items-center gap-1">
                    <span>📎</span>
                    <span>Your upload {imageAttachments.length > 1 ? `(${idx + 1})` : ''}</span>
                  </div>
                  <img
                    src={imgUrl}
                    alt={`User upload ${idx + 1}`}
                    className="w-full rounded-md"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMessage;
