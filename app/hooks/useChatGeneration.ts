import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { useGenerateImageMutation } from '../store/services/replicateApi';
import {
  addUserMessage,
  addAssistantMessage,
  updateAssistantMessage,
  clearCurrentInput,
  setGenerating,
  setAutoAttachDisabled,
} from '../store/slices/chatSlice';
import { showError, showSuccess } from '../utils/toast';
import { getModelById } from '../lib/models';
import {
  supportsImageInput,
  supportsCharacterImage,
  supportsFirstFrame,
  supportsInputReference,
  supportsImageToImage,
} from '../lib/models/helpers';

export const useChatGeneration = () => {
  const dispatch = useAppDispatch();
  const [generateImage, { isLoading: isGenerating }] = useGenerateImageMutation();

  const { currentInput } = useAppSelector((state) => state.chat);
  const selectedModelId = useAppSelector((state) => state.models.selectedModelId);
  const parameters = useAppSelector((state) => state.generator.parameters);

  const handleSend = useCallback(async () => {
    const model = getModelById(selectedModelId);
    if (!model) {
      showError('Please select a model');
      return;
    }

    if (!currentInput.prompt.trim()) {
      showError('Please enter a prompt');
      return;
    }

    let processingMessageId: string | null = null;

    try {
      dispatch(setGenerating(true));

      // Build final parameters with images
      const finalParams: Record<string, unknown> = { ...parameters, prompt: currentInput.prompt };

      // Handle image inputs based on model type
      if (supportsImageInput(model)) {
        // Models like SEEDream-4, Nano Banana (array of images)
        const images = [];
        if (currentInput.autoAttachedImage) {
          images.push(currentInput.autoAttachedImage);
        }
        // Add manual attachments
        currentInput.imageAttachments.forEach((img) => {
          images.push(img);
        });
        if (images.length > 0) {
          finalParams.imageInputs = images;
        }
      } else if (supportsCharacterImage(model)) {
        // Models like Ideogram (single image_file)
        if (currentInput.autoAttachedImage) {
          finalParams.characterImage = currentInput.autoAttachedImage;
        } else if (currentInput.imageAttachments[0]) {
          finalParams.characterImage = currentInput.imageAttachments[0];
        }
      } else if (supportsFirstFrame(model)) {
        // Video models like Hailuo-02
        if (currentInput.autoAttachedImage) {
          finalParams.firstFrameImage = currentInput.autoAttachedImage;
        } else if (currentInput.imageAttachments[0]) {
          finalParams.firstFrameImage = currentInput.imageAttachments[0];
        }
        if (currentInput.imageAttachments[1]) {
          finalParams.lastFrameImage = currentInput.imageAttachments[1];
        }
      } else if (supportsInputReference(model)) {
        // Video models like Sora 2
        if (currentInput.autoAttachedImage) {
          finalParams.inputReference = currentInput.autoAttachedImage;
        } else if (currentInput.imageAttachments[0]) {
          finalParams.inputReference = currentInput.imageAttachments[0];
        }
      } else if (supportsImageToImage(model)) {
        // Models with image parameter
        if (currentInput.autoAttachedImage) {
          finalParams.image = currentInput.autoAttachedImage;
        } else if (currentInput.imageAttachments[0]) {
          finalParams.image = currentInput.imageAttachments[0];
        }
      }

      // Add user message
      dispatch(
        addUserMessage({
          content: {
            prompt: currentInput.prompt,
            imageAttachments: currentInput.imageAttachments,
            autoAttachedImage: currentInput.autoAttachedImage,
            modelId: selectedModelId,
            modelName: model.name,
            parameters: finalParams,
          },
        })
      );

      // Add processing assistant message
      processingMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      dispatch(
        addAssistantMessage({
          id: processingMessageId,
          content: {
            status: 'processing',
            modelId: selectedModelId,
            modelName: model.name,
          },
        })
      );

      // Clear input
      dispatch(clearCurrentInput());

      // Start generation
      const data = await generateImage({
        model_id: selectedModelId,
        parameters: finalParams,
      }).unwrap();

      // Update message with result
      const outputArray = Array.isArray(data.output) ? data.output : [data.output];
      const filteredOutput = outputArray.filter((url): url is string => typeof url === 'string');
      const isVideo = model.category === 'image-to-video';

      dispatch(
        updateAssistantMessage({
          id: processingMessageId,
          updates: {
            status: 'succeeded',
            generatedImages: filteredOutput,
            isVideo,
            seed: data.seed,
          },
        })
      );

      // Reset auto-attach flag so new generation can be auto-attached
      dispatch(setAutoAttachDisabled(false));

      showSuccess('Image generated successfully!');
    } catch (error) {
      console.error('Chat generation error:', error);

      // Extract error message
      let errorMessage = 'Failed to generate image';
      if (error && typeof error === 'object') {
        if ('data' in error && error.data && typeof error.data === 'object' && 'error' in error.data) {
          errorMessage = String(error.data.error);
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }

      // Update processing message with error if it exists, otherwise add new error message
      if (processingMessageId) {
        dispatch(
          updateAssistantMessage({
            id: processingMessageId,
            updates: {
              status: 'failed',
              error: errorMessage,
            },
          })
        );
      } else {
        // Error happened before processing message was created
        dispatch(
          addAssistantMessage({
            id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: {
              status: 'failed',
              error: errorMessage,
              modelId: selectedModelId,
              modelName: getModelById(selectedModelId)?.name,
            },
          })
        );
      }

      showError(errorMessage);
    } finally {
      dispatch(setGenerating(false));
    }
  }, [currentInput, selectedModelId, parameters, dispatch, generateImage]);

  return {
    handleSend,
    isGenerating,
  };
};
