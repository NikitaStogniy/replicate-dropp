import type { ModelConfig } from '../lib/models/types';
import { supportsInpainting, validateAllParameters } from '../lib/models';

interface ValidationParams {
  currentModel: ModelConfig | null | undefined;
  parameters: Record<string, any>;
  inpaintingMode: boolean;
  maskPrompt: string;
}

export const validateGenerationParams = (
  params: ValidationParams
): string | null => {
  const { currentModel, parameters, inpaintingMode, maskPrompt } = params;

  if (!currentModel) {
    return 'Модель не выбрана';
  }

  // Schema-driven validation for all required fields
  const { valid, errors } = validateAllParameters(currentModel, parameters);
  if (!valid && errors.length > 0) {
    return errors[0]; // Return first error
  }

  // Special validation for inpainting mode
  if (inpaintingMode && !maskPrompt) {
    return 'Пожалуйста, опишите что вы хотите изменить в выделенной области';
  }

  if (inpaintingMode && !supportsInpainting(currentModel)) {
    return 'Выбранная модель не поддерживает inpainting. Пожалуйста, выберите одну из Ideogram моделей.';
  }

  return null;
};
