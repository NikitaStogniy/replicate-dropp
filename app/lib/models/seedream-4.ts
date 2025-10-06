import { ModelConfig } from './types';

export const seedream4: ModelConfig = {
  id: 'seedream-4',
  name: 'SEEDream-4',
  owner: 'bytedance',
  model: 'seedream-4',
  description: 'Advanced image generation with sequential scene creation and multi-reference support',
  category: 'text-to-image',
  estimatedTime: '15-30 сек',
  quality: 'high',
  schema: {
    required: ['prompt'],
    properties: {
      prompt: {
        type: 'string',
        title: 'Prompt',
        description: 'Text prompt for image generation',
        'x-order': 0
      },
      image_input: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uri'
        },
        title: 'Image Input',
        description: 'Input image(s) for image-to-image generation. List of 1-10 images for single or multi-reference generation.',
        default: [],
        'x-order': 1
      },
      size: {
        type: 'string',
        title: 'Size',
        description: "Image resolution: 1K (1024px), 2K (2048px), 4K (4096px), or 'custom' for specific dimensions.",
        enum: ['1K', '2K', '4K', 'custom'],
        default: '2K',
        'x-order': 2
      },
      aspect_ratio: {
        type: 'string',
        title: 'Aspect Ratio',
        description: "Image aspect ratio. Only used when size is not 'custom'. Use 'match_input_image' to automatically match the input image's aspect ratio.",
        enum: ['match_input_image', '1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'],
        default: 'match_input_image',
        'x-order': 3
      },
      width: {
        type: 'integer',
        title: 'Width',
        description: "Custom image width (only used when size='custom'). Range: 1024-4096 pixels.",
        minimum: 1024,
        maximum: 4096,
        default: 2048,
        'x-order': 4
      },
      height: {
        type: 'integer',
        title: 'Height',
        description: "Custom image height (only used when size='custom'). Range: 1024-4096 pixels.",
        minimum: 1024,
        maximum: 4096,
        default: 2048,
        'x-order': 5
      },
      sequential_image_generation: {
        type: 'string',
        title: 'Sequential Image Generation',
        description: "Group image generation mode. 'disabled' generates a single image. 'auto' lets the model decide whether to generate multiple related images (e.g., story scenes, character variations).",
        enum: ['disabled', 'auto'],
        default: 'disabled',
        'x-order': 6
      },
      max_images: {
        type: 'integer',
        title: 'Max Images',
        description: 'Maximum number of images to generate when sequential_image_generation=\'auto\'. Range: 1-15. Total images (input + generated) cannot exceed 15.',
        minimum: 1,
        maximum: 15,
        default: 1,
        'x-order': 7
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
