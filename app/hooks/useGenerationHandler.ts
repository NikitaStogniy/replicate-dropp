import { useCallback } from 'react';
import { useAppDispatch } from '../store';
import { useGenerateImageMutation } from '../store/services/replicateApi';
import { setResult } from '../store/slices/generatorSlice';
import { addHistoryItem } from '../store/slices/historySlice';
import { showError, showSuccess } from '../utils/toast';
import { imageUrlToBase64 } from '../utils/imageStorage';
import { getModelById, isVideoModel } from '../lib/models';

interface GenerationParams {
  parameters: Record<string, unknown>;
  selectedModelId: string;
  inpaintingMode: boolean;
  inpaintImage: string | null;
  maskImage: string | null;
  maskPrompt: string;
}

export const useGenerationHandler = () => {
  const dispatch = useAppDispatch();
  const [generateImage, { isLoading: isGenerating }] = useGenerateImageMutation();

  const handleGenerate = useCallback(
    async (params: GenerationParams) => {
      const {
        parameters,
        selectedModelId,
        inpaintingMode,
        inpaintImage,
        maskImage,
        maskPrompt,
      } = params;

      try {
        // Build final parameters with inpainting overrides
        const finalParams = { ...parameters };

        // Handle inpainting mode
        if (inpaintingMode && inpaintImage && maskImage) {
          const imageBlob = await fetch(inpaintImage).then((r) => r.blob());
          const inpaintImageFile = new File([imageBlob], 'inpaint-source.png', {
            type: 'image/png',
          });

          const maskBlob = await fetch(maskImage).then((r) => r.blob());
          const inpaintMaskFile = new File([maskBlob], 'inpaint-mask.png', {
            type: 'image/png',
          });

          finalParams.inpaintImage = inpaintImageFile;
          finalParams.inpaintMask = inpaintMaskFile;

          // Override prompt with mask prompt in inpainting mode
          if (maskPrompt) {
            finalParams.prompt = maskPrompt;
          }
        }

        const data = await generateImage({
          model_id: selectedModelId,
          parameters: finalParams,
        }).unwrap();

        dispatch(setResult({ modelId: selectedModelId, result: { ...data, parameters: finalParams } }));

        // Add to history if succeeded
        if (data.status === 'succeeded' && data.output) {
          try {
            const model = getModelById(selectedModelId);
            const isVideo = model ? isVideoModel(model) : false;

            // Get first image URL for conversion
            const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;

            // Convert to base64 only for images (not videos)
            let imageBase64: string | undefined;
            if (!isVideo && imageUrl) {
              try {
                imageBase64 = await imageUrlToBase64(imageUrl);
              } catch (conversionError) {
                console.warn('Failed to convert image to base64:', conversionError);
                // Continue without base64, will use URL fallback
              }
            }

            // Generate unique ID - use Replicate ID if valid, otherwise create UUID-like ID
            const uniqueId =
              data.id && data.id !== 'sdk-generated'
                ? data.id
                : `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            dispatch(
              addHistoryItem({
                id: uniqueId,
                timestamp: Date.now(),
                modelId: selectedModelId,
                modelName: model?.name || 'Unknown Model',
                parameters: finalParams,
                result: data,
                imageBase64,
                isVideo,
              })
            );
          } catch (historyError) {
            console.error('Failed to add to history:', historyError);
            // Don't fail the whole generation if history fails
          }
        }

        showSuccess('Генерация завершена успешно!');

        setTimeout(() => {
          const resultElement = document.querySelector('[data-result-section]');
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } catch (error) {
        console.error('Ошибка при генерации:', error);
        const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при генерации изображения';
        showError(errorMessage);

        dispatch(
          setResult({
            modelId: selectedModelId,
            result: {
              id: '',
              status: 'failed',
              error: errorMessage,
            },
          })
        );
      }
    },
    [dispatch, generateImage]
  );

  return {
    handleGenerate,
    isGenerating,
  };
};
