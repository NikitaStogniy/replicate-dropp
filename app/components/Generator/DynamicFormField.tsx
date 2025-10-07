'use client';

import { memo } from 'react';
import type { ParameterSchema } from '@/app/lib/models/types';
import type { ImageValue } from '@/app/utils/fileConversion';
import PromptInput from './PromptInput';
import ImageUploader from './ImageUploader';
import MultiImageUploader from './MultiImageUploader';
import StyleSelector from './StyleSelector';
import AspectRatioSelector from './AspectRatioSelector';
import SeedInput from './SeedInput';
import DurationSelector from './DurationSelector';
import ResolutionSelector from './ResolutionSelector';
import PromptOptimizerToggle from './PromptOptimizerToggle';

interface DynamicFormFieldProps {
  paramName: string;
  schema: ParameterSchema;
  value: string | number | boolean | ImageValue | ImageValue[] | null | undefined;
  onChange: (value: string | number | boolean | ImageValue | ImageValue[] | null) => void;
  onSubmit?: () => void;
  required?: boolean;
}

function DynamicFormFieldComponent({
  paramName,
  schema,
  value,
  onChange,
  onSubmit,
  required = false,
}: DynamicFormFieldProps) {
  // Determine component type
  const componentType = schema['x-component'] || inferComponentType(schema);

  // Render based on component type
  switch (componentType) {
    case 'textarea':
      return (
        <PromptInput
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          onSubmit={onSubmit}
        />
      );

    case 'image-upload':
      return (
        <ImageUploader
          label={schema.title}
          file={typeof value === 'object' && value !== null && 'dataUrl' in value ? value : null}
          required={required}
          onChange={onChange}
        />
      );

    case 'multi-image-upload':
      return (
        <MultiImageUploader
          label={schema.title}
          files={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );

    case 'button-group':
      if (schema.enum) {
        // Check if it's aspect ratio (has ratio labels)
        const isAspectRatio = paramName === 'aspect_ratio' || schema.title.toLowerCase().includes('aspect');

        if (isAspectRatio) {
          return (
            <AspectRatioSelector
              ratios={schema.enum as string[]}
              selected={(value as string) || (schema.default as string) || (schema.enum[0] as string)}
              onChange={onChange}
            />
          );
        }

        // Check if it's duration
        if (schema.type === 'integer' && paramName === 'duration') {
          return (
            <DurationSelector
              durations={schema.enum as number[]}
              selected={(value as number) || (schema.default as number) || (schema.enum[0] as number)}
              onChange={onChange}
            />
          );
        }

        // Check if it's resolution
        if (paramName === 'resolution' || schema.title.toLowerCase().includes('resolution')) {
          return (
            <ResolutionSelector
              resolutions={schema.enum as string[]}
              selected={(value as string) || (schema.default as string) || (schema.enum[0] as string)}
              onChange={onChange}
            />
          );
        }

        // Style selector for style_type
        if (paramName === 'style_type' || paramName === 'style') {
          return (
            <StyleSelector
              styles={schema.enum as string[]}
              selected={(value as string) || (schema.default as string) || (schema.enum[0] as string)}
              onChange={onChange}
            />
          );
        }

        // Generic button group for other enum fields
        return (
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              {schema.title}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(schema.enum as (string | number)[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    value === option || (!value && schema.default === option)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white/70 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      }
      break;

    case 'select':
      if (schema.enum) {
        return (
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              {schema.title}
            </label>
            <select
              value={(value as string) || (schema.default as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white/70 text-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
            >
              {(schema.enum as (string | number)[]).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      }
      break;

    case 'toggle':
      if (schema.type === 'boolean') {
        return (
          <PromptOptimizerToggle
            enabled={typeof value === 'boolean' ? value : (schema.default as boolean || false)}
            onChange={onChange}
          />
        );
      }
      break;

    case 'number-input':
      if (paramName === 'seed') {
        return (
          <SeedInput
            seed={value ? String(value) : ''}
            onSeedChange={(val) => onChange(val ? parseInt(val, 10) : null)}
          />
        );
      }

      return (
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            {schema.title}
          </label>
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
            min={schema.minimum}
            max={schema.maximum}
            className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white/70 text-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder={schema.description}
          />
        </div>
      );

    case 'text-input':
      return (
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            {schema.title}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white/70 text-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder={schema.description}
          />
        </div>
      );
  }

  return null;
}

// Infer component type from schema when x-component is not specified
function inferComponentType(schema: ParameterSchema): string {
  // Check for array of images (multi-image-upload)
  if (schema.type === 'array' && schema.items?.format === 'uri') {
    return 'multi-image-upload';
  }
  // Check for single image (image-upload)
  if (schema.format === 'uri') return 'image-upload';
  if (schema.type === 'boolean') return 'toggle';
  if (schema.type === 'integer' || schema.type === 'number') {
    if (schema.enum) return 'button-group';
    return 'number-input';
  }
  if (schema.type === 'string') {
    if (schema.enum) {
      if (schema.enum.length <= 5) return 'button-group';
      return 'select';
    }
    return 'text-input';
  }
  return 'text-input';
}

// Custom comparison function for React.memo
function arePropsEqual(
  prevProps: DynamicFormFieldProps,
  nextProps: DynamicFormFieldProps
): boolean {
  // Compare primitive props
  if (
    prevProps.paramName !== nextProps.paramName ||
    prevProps.required !== nextProps.required ||
    prevProps.onSubmit !== nextProps.onSubmit
  ) {
    return false;
  }

  // Deep compare schema (only check relevant properties)
  if (
    prevProps.schema.title !== nextProps.schema.title ||
    prevProps.schema.type !== nextProps.schema.type ||
    prevProps.schema['x-component'] !== nextProps.schema['x-component']
  ) {
    return false;
  }

  // Deep compare value (handles primitives, ImageValue objects, and arrays)
  if (typeof prevProps.value !== typeof nextProps.value) {
    return false;
  }

  // Handle arrays (for multi-image-upload)
  if (Array.isArray(prevProps.value) && Array.isArray(nextProps.value)) {
    if (prevProps.value.length !== nextProps.value.length) {
      return false;
    }
    // Compare array contents
    for (let i = 0; i < prevProps.value.length; i++) {
      const prev = prevProps.value[i] as ImageValue;
      const next = nextProps.value[i] as ImageValue;
      if (prev.dataUrl !== next.dataUrl) {
        return false;
      }
    }
    return true;
  }

  // For single ImageValue objects
  if (
    typeof prevProps.value === 'object' &&
    prevProps.value !== null &&
    typeof nextProps.value === 'object' &&
    nextProps.value !== null
  ) {
    const prevImg = prevProps.value as ImageValue;
    const nextImg = nextProps.value as ImageValue;

    if (
      'dataUrl' in prevImg &&
      'dataUrl' in nextImg &&
      prevImg.dataUrl !== nextImg.dataUrl
    ) {
      return false;
    }
  } else if (prevProps.value !== nextProps.value) {
    // For primitives
    return false;
  }

  return true;
}

// Export memoized component with custom comparison
export default memo(DynamicFormFieldComponent, arePropsEqual);
