import { ModelConfig } from './types';

export const sora2: ModelConfig = {
  id: 'sora-2',
  name: 'Sora 2',
  owner: 'openai',
  model: 'sora-2',
  description: 'Флагманская модель генерации видео от OpenAI с синхронизированным аудио',
  category: 'text-to-video',
  estimatedTime: '30-120 сек',
  quality: 'high',
  schema: {
    required: ['prompt'],
    properties: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        description: 'A text description of the video to generate',
        'x-order': 0,
        'x-component': 'textarea',
        'x-grid-column': 1,
        'x-ui-field': 'prompt',
        'x-api-field': 'prompt'
      },
      seconds: {
        type: 'integer',
        title: 'Duration (seconds)',
        description: 'Duration of the video in seconds',
        default: 4,
        minimum: 1,
        maximum: 20,
        'x-order': 1,
        'x-component': 'slider',
        'x-grid-column': 2,
        'x-ui-field': 'seconds',
        'x-api-field': 'seconds'
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        description: 'Aspect ratio of the video. Portrait is 720x1280, landscape is 1280x720',
        default: 'portrait',
        enum: ['portrait', 'landscape'],
        'x-order': 2,
        'x-component': 'button-group',
        'x-grid-column': 2,
        'x-ui-field': 'aspectRatio',
        'x-api-field': 'aspect_ratio'
      },
      input_reference: {
        type: 'string',
        title: 'Reference Image',
        description: 'An optional image to use as the first frame of the video. The image must be the same aspect ratio as the video.',
        format: 'uri',
        'x-order': 3,
        'x-component': 'image-upload',
        'x-grid-column': 1,
        'x-ui-field': 'inputReference',
        'x-api-field': 'input_reference'
      }
    }
  },
  output: {
    type: 'string',
    format: 'uri',
    title: 'Output'
  }
};
