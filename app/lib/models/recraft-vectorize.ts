import { ModelConfig } from './types';

export const recraftVectorize: ModelConfig = {
  id: 'recraft-vectorize',
  name: 'Recraft Vectorize',
  owner: 'recraft-ai',
  model: 'recraft-vectorize',
  description: 'Конвертация растровых изображений в высококачественный SVG формат с чистыми векторными путями. Идеально для логотипов, иконок и масштабируемой графики.',
  category: 'image-to-image',
  estimatedTime: '5-15 сек',
  quality: 'high',
  schema: {
    required: ['image'],
    properties: {
      image: {
        type: 'string',
        title: 'Source Image',
        description: 'Image to convert to SVG vector format',
        format: 'uri',
        'x-order': 0,
        'x-component': 'image-upload',
        'x-grid-column': 1,
        'x-ui-field': 'image',
        'x-api-field': 'image'
      }
    }
  },
  output: {
    type: 'string',
    format: 'uri',
    title: 'Output'
  }
};
