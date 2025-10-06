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
        'x-order': 0
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
        'x-order': 1
      },
      aspect_ratio: {
        type: 'string',
        title: 'aspect_ratio',
        description: 'Aspect ratio of the generated image',
        enum: ['match_input_image', '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
        default: 'match_input_image',
        'x-order': 2
      },
      output_format: {
        type: 'string',
        title: 'output_format',
        description: 'Format of the output image',
        enum: ['jpg', 'png'],
        default: 'jpg',
        'x-order': 3
      }
    }
  },
  output: {
    type: 'string',
    format: 'uri',
    title: 'Output'
  }
};
