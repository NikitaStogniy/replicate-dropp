'use client';

import { useState } from 'react';
import type { ChatMessage } from '@/app/store/slices/chatSlice';
import { useAppDispatch } from '@/app/store';
import { setAutoAttachedImage } from '@/app/store/slices/chatSlice';
import { Bot, Download, Loader2, AlertCircle, Image as ImageIcon, Copy } from 'lucide-react';
import { useImageDownload } from '@/app/hooks/useImageDownload';

interface AssistantMessageProps {
  message: ChatMessage;
}

const AssistantMessage = ({ message }: AssistantMessageProps) => {
  const dispatch = useAppDispatch();
  const { downloadImage } = useImageDownload();
  const { status, generatedImages, error, modelName, seed } = message.content;
  const [imageLoadError, setImageLoadError] = useState<Record<number, boolean>>({});

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleUseAsInput = (imageUrl: string) => {
    dispatch(setAutoAttachedImage(imageUrl));
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    await downloadImage(imageUrl, `generation-${index + 1}.png`);
  };

  const handleCopyUrl = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl);
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[70%]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
          {modelName && <span className="text-xs text-gray-400">• {modelName}</span>}
        </div>

        <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
          {/* Processing State */}
          {status === 'processing' && (
            <div className="flex items-center gap-3 text-gray-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Generating image...</span>
            </div>
          )}

          {/* Success State */}
          {status === 'succeeded' && generatedImages && generatedImages.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {generatedImages.map((imageUrl, idx) => (
                  <div key={idx} className="relative group">
                    {!imageLoadError[idx] ? (
                      <img
                        src={imageUrl}
                        alt={`Generated image ${idx + 1}`}
                        className="w-full rounded-lg shadow-sm"
                        loading="lazy"
                        onError={() => setImageLoadError((prev) => ({ ...prev, [idx]: true }))}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Failed to load image</p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons overlay */}
                    {!imageLoadError[idx] && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleDownload(imageUrl, idx)}
                          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                          title="Download"
                        >
                          <Download size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => handleUseAsInput(imageUrl)}
                          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                          title="Use as input"
                        >
                          <ImageIcon size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => handleCopyUrl(imageUrl)}
                          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                          title="Copy URL"
                        >
                          <Copy size={16} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {seed !== undefined && (
                <div className="text-xs text-gray-400">
                  Seed: {seed}
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {status === 'failed' && (
            <div className="flex items-start gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Generation failed</p>
                {error && <p className="text-xs opacity-90">{error}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;
