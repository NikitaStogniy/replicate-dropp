import { ModelConfig } from './types';

export const nanoBanana: ModelConfig = {
  id: 'nano-banana',
  name: 'Nano Banana',
  owner: 'google',
  model: 'nano-banana',
  description: 'Image generation and transformation with multiple input images support',
  category: 'text-to-image',
  estimatedTime: '10-20 сек',
  quality: 'fast',
  schema: {
    required: ['prompt'],
    properties: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        description: 'A text description of the image you want to generate',
        'x-order': 0,
        'x-component': 'textarea',
        'x-grid-column': 1,
        'x-ui-field': 'prompt',
        'x-api-field': 'prompt'
      },
      image_input: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uri'
        },
        title: 'Image Input',
        description: 'Input images to transform or use as reference (supports multiple images)',
        default: [],
        'x-order': 1,
        'x-component': 'multi-image-upload',
        'x-grid-column': 1,
        'x-ui-field': 'imageInputs',
        'x-api-field': 'image_input'
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        description: 'Aspect ratio of the generated image',
        enum: ['match_input_image', '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
        default: 'match_input_image',
        'x-order': 2,
        'x-component': 'button-group',
        'x-grid-column': 2,
        'x-ui-field': 'aspectRatio',
        'x-api-field': 'aspect_ratio'
      },
      output_format: {
        type: 'string',
        title: 'Output Format',
        description: 'Format of the output image',
        enum: ['jpg', 'png'],
        default: 'jpg',
        'x-order': 3,
        'x-component': 'button-group',
        'x-grid-column': 2,
        'x-ui-field': 'outputFormat',
        'x-api-field': 'output_format'
      },
      seed: {
        type: 'integer',
        title: 'Seed',
        description: 'Random seed for reproducible generation',
        'x-order': 4,
        'x-component': 'number-input',
        'x-grid-column': 2,
        'x-ui-field': 'seed',
        'x-api-field': 'seed'
      }
    }
  },
  output: {
    type: 'string',
    format: 'uri',
    title: 'Output'
  }
};
