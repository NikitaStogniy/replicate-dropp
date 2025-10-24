import { ModelConfig } from './types';
import { ideogramV3Turbo } from './ideogram-v3-turbo';
import { seedream4 } from './seedream-4';
import { nanoBanana } from './nano-banana';
import { hailuo02 } from './hailuo-02';
import { briaRemoveBg } from './bria-remove-bg';

// Export types
export * from './types';
export * from './helpers';

// Export all models
export const MODELS: ModelConfig[] = [
  ideogramV3Turbo,
  seedream4,
  nanoBanana,
  hailuo02,
  briaRemoveBg,
  // Add other models here as you create them
];

// Helper functions
export const getModelById = (id: string): ModelConfig | undefined => {
  return MODELS.find(model => model.id === id);
};

export const getModelsByCategory = (category: ModelConfig['category']): ModelConfig[] => {
  return MODELS.filter(model => model.category === category);
};

export const getAllModels = (): ModelConfig[] => {
  return MODELS;
};
