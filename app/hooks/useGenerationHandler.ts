import { useCallback } from 'react';
import { useAppDispatch } from '../store';
import { useGenerateImageMutation } from '../store/services/replicateApi';
import { setResult } from '../store/slices/generatorSlice';
import type { ImageInputItem } from '../store/slices/generatorSlice';

interface GenerationParams {
  prompt: string;
  selectedModelId: string;
  characterImage: File | null;
  imageInputs: ImageInputItem[];
  styleType: string;
  aspectRatio: string;
  seed: string;
  duration: number;
  resolution: string;
  promptOptimizer: boolean;
  firstFrameImage: File | null;
  lastFrameImage: File | null;
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
        prompt,
        selectedModelId,
        characterImage,
        imageInputs,
        styleType,
        aspectRatio,
        seed,
        duration,
        resolution,
        promptOptimizer,
        firstFrameImage,
        lastFrameImage,
        inpaintingMode,
        inpaintImage,
        maskImage,
        maskPrompt,
      } = params;

      try {
        let inpaintImageFile: File | null = null;
        let inpaintMaskFile: File | null = null;

        if (inpaintingMode && inpaintImage && maskImage) {
          const imageBlob = await fetch(inpaintImage).then((r) => r.blob());
          inpaintImageFile = new File([imageBlob], 'inpaint-source.png', {
            type: 'image/png',
          });

          const maskBlob = await fetch(maskImage).then((r) => r.blob());
          inpaintMaskFile = new File([maskBlob], 'inpaint-mask.png', {
            type: 'image/png',
          });
        }

        const finalPrompt = inpaintingMode && maskPrompt ? maskPrompt : prompt;

        const data = await generateImage({
          prompt: finalPrompt,
          model_id: selectedModelId,
          character_reference_image: characterImage,
          image_inputs: imageInputs.length > 0 ? imageInputs : undefined,
          style_type: styleType,
          aspect_ratio: aspectRatio,
          seed: seed,
          inpaint_image: inpaintImageFile,
          inpaint_mask: inpaintMaskFile,
          duration: duration,
          resolution: resolution,
          prompt_optimizer: promptOptimizer,
          first_frame_image: firstFrameImage,
          last_frame_image: lastFrameImage,
        }).unwrap();

        dispatch(setResult({ modelId: selectedModelId, result: data }));

        setTimeout(() => {
          const resultElement = document.querySelector('[data-result-section]');
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } catch (error) {
        console.error('Ошибка при генерации:', error);
        dispatch(
          setResult({
            modelId: selectedModelId,
            result: {
              id: '',
              status: 'failed',
              error: 'Произошла ошибка при генерации изображения',
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
