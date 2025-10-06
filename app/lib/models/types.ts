// UI Component types for dynamic form rendering
export type UIComponentType =
  | 'text-input'
  | 'textarea'
  | 'select'
  | 'button-group'
  | 'image-upload'
  | 'multi-image-upload'
  | 'toggle'
  | 'slider'
  | 'number-input';

// Parameter schema types
export interface ParameterSchema {
  type: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  default?: string | number | boolean | null | undefined | never[];
  enum?: string[] | number[];
  minimum?: number;
  maximum?: number;
  items?: {
    type: string;
    format?: string;
  };
  format?: string;
  'x-order'?: number;
  // Custom extensions for UI rendering
  'x-component'?: UIComponentType;
  'x-depends-on'?: string; // Field name this parameter depends on
  'x-depends-value'?: any; // Value the dependency must have
  'x-grid-column'?: 1 | 2; // Which column to render in (1 = left, 2 = right)
  // Field name mapping for UI ↔ API
  'x-ui-field'?: string; // Field name in UI/Redux (camelCase)
  'x-api-field'?: string; // Field name in API request (snake_case)
}

export interface OutputSchema {
  type: 'string' | 'array' | 'object';
  items?: {
    type: string;
    format?: string;
  };
  format?: string;
  title?: string;
}

export interface ModelSchema {
  required: string[];
  properties: Record<string, ParameterSchema>;
}

// Main model configuration
export interface ModelConfig {
  id: string;
  name: string;
  owner: string;
  model: string;
  description: string;
  category: 'text-to-image' | 'character' | 'style-transfer' | 'image-to-video' | 'text-to-video';
  estimatedTime: string;
  quality: 'fast' | 'balanced' | 'high';
  schema: ModelSchema;
  output: OutputSchema;
}
