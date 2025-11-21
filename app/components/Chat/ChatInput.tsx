'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import {
  setCurrentPrompt,
  addImageAttachment,
  removeImageAttachment,
  setAutoAttachedImage,
  setAutoAttachDisabled,
  urlToImageValue,
} from '@/app/store/slices/chatSlice';
import { getModelById } from '@/app/lib/models';
import {
  supportsImageInput,
  supportsCharacterImage,
  supportsFirstFrame,
  supportsImageToImage,
} from '@/app/lib/models/helpers';
import { Send, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import { type ImageValue } from '@/app/utils/fileConversion';
import { getImageDataUrl } from '@/app/store/slices/chatSlice';

interface ChatInputProps {
  onSend: () => void;
  isGenerating: boolean;
}

const ChatInput = ({ onSend, isGenerating }: ChatInputProps) => {
  const dispatch = useAppDispatch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentInput, messages } = useAppSelector((state) => state.chat);
  const selectedModelId = useAppSelector((state) => state.models.selectedModelId);

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get last generated image from messages
  const lastGeneratedImage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (
        msg.type === 'assistant' &&
        msg.content.status === 'succeeded' &&
        msg.content.generatedImages?.length &&
        !msg.content.isVideo  // Only attach images, not videos
      ) {
        return msg.content.generatedImages[0];
      }
    }
    return null;
  }, [messages]);

  // Auto-attach logic
  useEffect(() => {
    const model = getModelById(selectedModelId);
    if (!model) return;

    // Check if model supports any image input
    const supportsImage =
      supportsImageInput(model) ||
      supportsCharacterImage(model) ||
      supportsFirstFrame(model) ||
      supportsImageToImage(model);

    if (
      supportsImage &&
      lastGeneratedImage &&
      currentInput.prompt.length > 0 &&
      !currentInput.autoAttachDisabled
    ) {
      // User is typing AND there's a previous generation AND model supports images AND user hasn't disabled auto-attach
      // Convert URL to ImageValue before dispatching
      urlToImageValue(lastGeneratedImage)
        .then((imageValue) => {
          dispatch(setAutoAttachedImage(imageValue));
        })
        .catch((error) => {
          console.error('Failed to convert auto-attached image:', error);
          dispatch(setAutoAttachedImage(null));
        });
    } else if (currentInput.autoAttachDisabled) {
      // Don't clear auto-attached image if user manually disabled it
      // (keep it null as they removed it)
    } else {
      dispatch(setAutoAttachedImage(null));
    }
  }, [currentInput.prompt, lastGeneratedImage, selectedModelId, currentInput.autoAttachDisabled, dispatch]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setCurrentPrompt(e.target.value));

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentInput.prompt.trim() && !isGenerating) {
        onSend();
      }
    }
  };

  const handleSendClick = () => {
    if (currentInput.prompt.trim() && !isGenerating) {
      onSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageValue: ImageValue = {
          dataUrl: reader.result as string,
          name: file.name,
          type: file.type,
        };
        dispatch(addImageAttachment(imageValue));
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    dispatch(removeImageAttachment(index));
  };

  const handleRemoveAutoAttached = () => {
    dispatch(setAutoAttachedImage(null));
    dispatch(setAutoAttachDisabled(true));
  };

  return (
    <div className="bg-[#0a0a0a] p-4">
      {/* Image Previews */}
      {(currentInput.autoAttachedImage || currentInput.imageAttachments.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {/* Auto-attached image */}
          {currentInput.autoAttachedImage && (
            <div className="relative group">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-500 bg-blue-900/20">
                <img
                  src={getImageDataUrl(currentInput.autoAttachedImage)}
                  alt="Auto-attached"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                Auto
              </div>
              <button
                onClick={handleRemoveAutoAttached}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Manual attachments */}
          {currentInput.imageAttachments.map((img, idx) => (
            <div key={idx} className="relative group">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-green-500 bg-green-900/20">
                <img
                  src={getImageDataUrl(img)}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 items-end">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating}
          className="flex-shrink-0 p-3 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Add image"
        >
          <ImageIcon size={20} className="text-gray-400" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
          disabled={isGenerating}
        />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={currentInput.prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe the image you want to create..."
            disabled={isGenerating}
            className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{ maxHeight: '200px' }}
          />

          {currentInput.autoAttachedImage && (
            <div className="absolute top-2 right-2 text-blue-500" title="Using previous image">
              <Sparkles size={16} />
            </div>
          )}
        </div>

        <button
          onClick={handleSendClick}
          disabled={!currentInput.prompt.trim() || isGenerating}
          className="flex-shrink-0 p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Info text for auto-attach */}
      {currentInput.autoAttachedImage && (
        <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
          <Sparkles size={12} />
          <span>Using previous generation as input</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
