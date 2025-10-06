import { ModelConfig } from './types';

export const ideogramV3Turbo: ModelConfig = {
  id: 'ideogram-v3-turbo',
  name: 'Ideogram v3 Turbo',
  owner: 'ideogram-ai',
  model: 'ideogram-v3-turbo',
  description: 'Быстрая генерация с отличным качеством текста, поддержкой inpainting и опциональным референсом',
  category: 'text-to-image',
  estimatedTime: '10-25 сек',
  quality: 'fast',
  schema: {
    required: ['prompt'],
    properties: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        description: 'Text prompt for image generation',
        'x-order': 0,
        'x-component': 'textarea',
        'x-grid-column': 1,
        'x-ui-field': 'prompt',
        'x-api-field': 'prompt'
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        description: 'Image aspect ratio',
        enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2', '16:10', '10:16'],
        default: '1:1',
        'x-order': 1,
        'x-component': 'button-group',
        'x-grid-column': 2,
        'x-ui-field': 'aspectRatio',
        'x-api-field': 'aspect_ratio'
      },
      resolution: {
        type: 'string',
        title: 'Resolution',
        description: 'Image resolution in pixels',
        enum: [
          '1024x1024',
          '512x1536',
          '576x1408',
          '640x1536',
          '768x1344',
          '832x1216',
          '896x1152',
          '1152x896',
          '1216x832',
          '1344x768',
          '1408x576',
          '1536x512',
          '1536x640'
        ],
        default: '1024x1024',
        'x-order': 2,
        'x-component': 'select',
        'x-grid-column': 2,
        'x-ui-field': 'resolution',
        'x-api-field': 'resolution'
      },
      style_type: {
        type: 'string',
        title: 'Style',
        description: 'Image generation style',
        enum: ['Auto', 'General', 'Realistic', 'Design'],
        default: 'Auto',
        'x-order': 3,
        'x-component': 'button-group',
        'x-grid-column': 2,
        'x-ui-field': 'styleType',
        'x-api-field': 'style_type'
      },
      image_file: {
        type: 'string',
        title: 'Character Image',
        description: 'Optional reference image for character consistency',
        format: 'uri',
        'x-order': 4,
        'x-component': 'image-upload',
        'x-grid-column': 1,
        'x-ui-field': 'characterImage',
        'x-api-field': 'image_file'
      },
      mask: {
        type: 'string',
        title: 'Inpainting Mask',
        description: 'Mask image for inpainting (black areas will be regenerated)',
        format: 'uri',
        'x-order': 5,
        'x-component': 'image-upload',
        'x-grid-column': 1
      },
      seed: {
        type: 'integer',
        title: 'Seed',
        description: 'Random seed for reproducible generation',
        'x-order': 6,
        'x-component': 'number-input',
        'x-grid-column': 2,
        'x-ui-field': 'seed',
        'x-api-field': 'seed'
      }
    }
  },
  output: {
    type: 'array',
    items: {
      type: 'string',
      format: 'uri'
    },
    title: 'Output'
  }
};
