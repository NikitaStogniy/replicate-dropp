export interface ModelConfig {
  id: string;
  name: string;
  owner: string;
  model: string;
  description: string;
  category: 'text-to-image' | 'character' | 'style-transfer';
  supportsCharacterImage?: boolean;
  requiresCharacterImage?: boolean;
  supportedAspectRatios: string[];
  supportedStyles?: string[];
  estimatedTime: string;
  quality: 'fast' | 'balanced' | 'high';
}

export const MODELS: ModelConfig[] = [
  {
    id: 'ideogram-v3-turbo',
    name: 'Ideogram v3 Turbo',
    owner: 'ideogram-ai',
    model: 'ideogram-v3-turbo',
    description: 'Быстрая генерация с отличным качеством текста и опциональным референсом',
    category: 'text-to-image',
    supportsCharacterImage: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedStyles: ['Auto', 'General', 'Realistic', 'Design'],
    estimatedTime: '10-25 сек',
    quality: 'fast'
  },
  {
    id: 'ideogram-v3-balanced',
    name: 'Ideogram v3 Balanced',
    owner: 'ideogram-ai',
    model: 'ideogram-v3-balanced',
    description: 'Оптимальный баланс скорости, качества и стоимости с опциональным референсом',
    category: 'text-to-image',
    supportsCharacterImage: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedStyles: ['Auto', 'General', 'Realistic', 'Design'],
    estimatedTime: '20-40 сек',
    quality: 'balanced'
  },
  {
    id: 'ideogram-v3-quality',
    name: 'Ideogram v3 Quality',
    owner: 'ideogram-ai',
    model: 'ideogram-v3-quality',
    description: 'Максимальное качество Ideogram v3 с потрясающим реализмом и опциональным референсом',
    category: 'text-to-image',
    supportsCharacterImage: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedStyles: ['Auto', 'General', 'Realistic', 'Design'],
    estimatedTime: '40-60 сек',
    quality: 'high'
  },
  {
    id: 'ideogram-character',
    name: 'Ideogram Character',
    owner: 'ideogram-ai',
    model: 'ideogram-character',
    description: 'Специализированная модель для создания консистентных персонажей с референсным изображением',
    category: 'text-to-image',
    supportsCharacterImage: true,
    requiresCharacterImage: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedStyles: ['Auto', 'Fiction', 'Realistic'],
    estimatedTime: '15-35 сек',
    quality: 'balanced'
  },
  {
    id: 'flux-schnell',
    name: 'FLUX Schnell',
    owner: 'black-forest-labs',
    model: 'flux-schnell',
    description: 'Быстрая версия FLUX - отличное качество за меньшее время',
    category: 'text-to-image',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    estimatedTime: '10-20 сек',
    quality: 'fast'
  },
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    owner: 'black-forest-labs',
    model: 'flux-dev',
    description: 'Улучшенная версия FLUX с лучшим качеством',
    category: 'text-to-image',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    estimatedTime: '20-40 сек',
    quality: 'balanced'
  },
  {
    id: 'flux-pro',
    name: 'FLUX Pro',
    owner: 'black-forest-labs',
    model: 'flux-pro',
    description: 'Премиум версия FLUX с максимальным качеством',
    category: 'text-to-image',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    estimatedTime: '40-80 сек',
    quality: 'high'
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    owner: 'stability-ai',
    model: 'sdxl',
    description: 'Популярная модель с отличным балансом скорости и качества',
    category: 'text-to-image',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedStyles: ['Auto', 'Photographic', 'Anime', 'Digital Art', 'Comic Book', 'Fantasy Art'],
    estimatedTime: '15-30 сек',
    quality: 'balanced'
  },
  {
    id: 'playground-v25',
    name: 'Playground v2.5',
    owner: 'playgroundai',
    model: 'playground-v2.5-1024px-aesthetic',
    description: 'Эстетически приятные изображения высокого качества',
    category: 'text-to-image',
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    estimatedTime: '20-35 сек',
    quality: 'high'
  }
];

export const getModelById = (id: string): ModelConfig | undefined => {
  return MODELS.find(model => model.id === id);
};

export const getModelsByCategory = (category: ModelConfig['category']): ModelConfig[] => {
  return MODELS.filter(model => model.category === category);
};

export const getAllModels = (): ModelConfig[] => {
  return MODELS;
};