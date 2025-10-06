import { ModelConfig, ParameterSchema } from './types';

// Schema helper functions
export const isParameterRequired = (model: ModelConfig, paramName: string): boolean => {
  return model.schema.required.includes(paramName);
};

export const getParameterDefault = (model: ModelConfig, paramName: string): string | number | boolean | null | undefined => {
  const defaultValue = model.schema.properties[paramName]?.default;
  return Array.isArray(defaultValue) ? undefined : defaultValue;
};

export const getParameterEnum = (model: ModelConfig, paramName: string): (string | number)[] | undefined => {
  return model.schema.properties[paramName]?.enum;
};

export const validateParameter = (
  model: ModelConfig,
  paramName: string,
  value: string | number | boolean | null | undefined
): { valid: boolean; error?: string } => {
  const param = model.schema.properties[paramName];

  if (!param) {
    return { valid: false, error: `Unknown parameter: ${paramName}` };
  }

  // Check required
  if (isParameterRequired(model, paramName) && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${param.title} is required` };
  }

  // Skip validation if optional and not provided
  if (value === undefined || value === null || value === '') {
    return { valid: true };
  }

  // Type validation
  if (param.type === 'integer' || param.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { valid: false, error: `${param.title} must be a number` };
    }
    if (param.minimum !== undefined && numValue < param.minimum) {
      return { valid: false, error: `${param.title} must be at least ${param.minimum}` };
    }
    if (param.maximum !== undefined && numValue > param.maximum) {
      return { valid: false, error: `${param.title} must be at most ${param.maximum}` };
    }
  }

  // Enum validation
  if (param.enum && typeof value !== 'boolean' && !(param.enum as (string | number)[]).includes(value)) {
    return { valid: false, error: `${param.title} must be one of: ${param.enum.join(', ')}` };
  }

  return { valid: true };
};

export const getOrderedParameters = (model: ModelConfig): [string, ParameterSchema][] => {
  return Object.entries(model.schema.properties).sort((a, b) => {
    const orderA = a[1]['x-order'] ?? 999;
    const orderB = b[1]['x-order'] ?? 999;
    return orderA - orderB;
  });
};

// Feature detection helpers (derived from schema)
export const supportsCharacterImage = (model: ModelConfig): boolean => {
  return !!model.schema.properties.image_file;
};

export const requiresCharacterImage = (model: ModelConfig): boolean => {
  return model.schema.required.includes('image_file');
};

export const supportsInpainting = (model: ModelConfig): boolean => {
  return !!model.schema.properties.mask;
};

export const supportsImageToImage = (model: ModelConfig): boolean => {
  return !!model.schema.properties.image;
};

export const supportsImageInput = (model: ModelConfig): boolean => {
  return !!model.schema.properties.image_input;
};

export const getSupportedAspectRatios = (model: ModelConfig): string[] => {
  const aspectRatioParam = model.schema.properties.aspect_ratio;
  if (aspectRatioParam?.enum) {
    return aspectRatioParam.enum as string[];
  }
  return [];
};

export const getSupportedStyles = (model: ModelConfig): string[] | undefined => {
  const styleParam = model.schema.properties.style_type || model.schema.properties.style_preset || model.schema.properties.style;
  if (styleParam?.enum) {
    return styleParam.enum as string[];
  }
  return undefined;
};

// Video-specific feature detection
export const supportsFirstFrame = (model: ModelConfig): boolean => {
  return !!model.schema.properties.first_frame_image;
};

export const supportsLastFrame = (model: ModelConfig): boolean => {
  return !!model.schema.properties.last_frame_image;
};

export const supportsDuration = (model: ModelConfig): boolean => {
  return !!model.schema.properties.duration;
};

export const supportsResolution = (model: ModelConfig): boolean => {
  return !!model.schema.properties.resolution;
};

export const supportsPromptOptimizer = (model: ModelConfig): boolean => {
  return !!model.schema.properties.prompt_optimizer;
};

// Generic parameter getter
export const getParameterSchema = (model: ModelConfig, paramName: string): ParameterSchema | undefined => {
  return model.schema.properties[paramName];
};

// Model type detection
export const isVideoModel = (model: ModelConfig): boolean => {
  return model.category === 'text-to-video' || model.category === 'image-to-video';
};

export const isImageModel = (model: ModelConfig): boolean => {
  return model.category === 'text-to-image' || model.category === 'image-to-image';
};

// Resolution helpers
export const getDefaultResolutions = (model: ModelConfig): string[] => {
  // If model explicitly defines resolutions, use those
  const resolutionParam = model.schema.properties.resolution;
  if (resolutionParam?.enum) {
    return resolutionParam.enum as string[];
  }

  // Otherwise return appropriate defaults based on model type
  if (isVideoModel(model)) {
    return ['512p', '768p', '1080p'];
  }

  if (isImageModel(model)) {
    return ['1024x1024', '512x1536', '768x1344', '1536x512'];
  }

  return [];
};

// Schema-driven validation for all parameters
export const validateAllParameters = (
  model: ModelConfig,
  parameters: Record<string, any>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate all required fields from schema
  model.schema.required.forEach((paramName) => {
    const schema = model.schema.properties[paramName];
    if (!schema) return;

    // Get the UI field name (camelCase) or use schema name
    const uiField = schema['x-ui-field'] || paramName;
    const value = parameters[uiField];

    const validation = validateParameter(model, paramName, value);
    if (!validation.valid && validation.error) {
      errors.push(validation.error);
    }
  });

  // Validate all provided parameters (type checking, enums, etc.)
  Object.entries(parameters).forEach(([uiField, value]) => {
    // Find the schema parameter that matches this UI field
    const schemaEntry = Object.entries(model.schema.properties).find(
      ([_, schema]) => (schema['x-ui-field'] || _) === uiField
    );

    if (schemaEntry && value !== undefined && value !== null && value !== '') {
      const [paramName] = schemaEntry;
      const validation = validateParameter(model, paramName, value);

      // Only add error if not already added by required check
      if (!validation.valid && validation.error && !errors.includes(validation.error)) {
        errors.push(validation.error);
      }
    }
  });

  return { valid: errors.length === 0, errors };
};

// Map UI parameters to API parameters using schema field mapping
export const mapParametersToAPI = (
  model: ModelConfig,
  uiParameters: Record<string, any>
): Record<string, any> => {
  const apiParams: Record<string, any> = {};

  Object.entries(model.schema.properties).forEach(([schemaKey, schema]) => {
    // Get the UI field name (camelCase) and API field name (snake_case)
    const uiField = schema['x-ui-field'] || schemaKey;
    const apiField = schema['x-api-field'] || schemaKey;

    const value = uiParameters[uiField];

    // Only include if value exists and is not empty
    if (value !== undefined && value !== null && value !== '') {
      apiParams[apiField] = value;
    }
  });

  return apiParams;
};
