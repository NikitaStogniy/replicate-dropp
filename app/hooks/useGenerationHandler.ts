import { useCallback } from 'react';
import { useAppDispatch } from '../store';
import { useGenerateImageMutation } from '../store/services/replicateApi';
import { setResult } from '../store/slices/generatorSlice';
import { showError, showSuccess } from '../utils/toast';

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

        dispatch(setResult({ modelId: selectedModelId, result: data }));

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
