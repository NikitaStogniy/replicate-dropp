import { useCallback } from 'react';
import { useAppDispatch } from '../store';
import { startInpainting, setSelectedModel } from '../store/slices';
import { getAllModels, supportsInpainting } from '../lib/models';
import type { ModelConfig } from '../lib/models/types';
import { showInfo } from '../utils/toast';

export const useInpaintingHandler = (currentModel: ModelConfig | null | undefined) => {
  const dispatch = useAppDispatch();
  const availableModels = getAllModels();

  const handleStartInpainting = useCallback(
    (imageUrl: string) => {
      dispatch(startInpainting(imageUrl));

      // Автоматически переключаемся на модель с поддержкой inpainting, если текущая не поддерживает
      if (currentModel && !supportsInpainting(currentModel)) {
        const inpaintingModels = availableModels.filter((model) =>
          supportsInpainting(model)
        );
        const preferredOrder = [
          'ideogram-v3-quality',
          'ideogram-v3-balanced',
          'ideogram-v3-turbo',
          'ideogram-v2',
        ];

        let selectedInpaintingModel = null;
        for (const preferredId of preferredOrder) {
          selectedInpaintingModel = inpaintingModels.find(
            (model) => model.id === preferredId
          );
          if (selectedInpaintingModel) break;
        }

        if (selectedInpaintingModel) {
          dispatch(setSelectedModel(selectedInpaintingModel.id));

          setTimeout(() => {
            showInfo(
              `Переключено на модель "${selectedInpaintingModel.name}" для поддержки inpainting`
            );
          }, 100);
        }
      }
    },
    [currentModel, availableModels, dispatch]
  );

  return {
    handleStartInpainting,
  };
};
