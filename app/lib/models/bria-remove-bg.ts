import { ModelConfig } from './types';

export const briaRemoveBg: ModelConfig = {
  id: 'bria-remove-bg',
  name: 'BRIA Remove Background',
  owner: 'bria',
  model: 'remove-background',
  description: 'Удаление фона с изображений с высокой точностью и сохранением мелких деталей (256 уровней прозрачности)',
  category: 'image-to-image',
  estimatedTime: '5-15 сек',
  quality: 'high',
  schema: {
    required: ['image'],
    properties: {
      image: {
        type: 'string',
        title: 'Source Image',
        description: 'Image to remove background from',
        format: 'uri',
        'x-order': 0,
        'x-component': 'image-upload',
        'x-grid-column': 1,
        'x-ui-field': 'image',
        'x-api-field': 'image'
      },
      preserve_alpha: {
        type: 'boolean',
        title: 'Preserve Alpha Channel',
        description: 'Retain transparency for semi-transparent edges from input image',
        default: false,
        'x-order': 1,
        'x-component': 'toggle',
        'x-grid-column': 2,
        'x-ui-field': 'preserveAlpha',
        'x-api-field': 'preserve_alpha'
      }
    }
  },
  output: {
    type: 'string',
    format: 'uri',
    title: 'Output'
  }
};
