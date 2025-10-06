'use client';

import type { ParameterSchema } from '@/app/lib/models/types';
import PromptInput from './PromptInput';
import ImageUploader from './ImageUploader';
import StyleSelector from './StyleSelector';
import AspectRatioSelector from './AspectRatioSelector';
import SeedInput from './SeedInput';
import DurationSelector from './DurationSelector';
import ResolutionSelector from './ResolutionSelector';
import PromptOptimizerToggle from './PromptOptimizerToggle';

interface DynamicFormFieldProps {
  paramName: string;
  schema: ParameterSchema;
  value: any;
  onChange: (value: any) => void;
  required?: boolean;
}

// Label mapping for common aspect ratios
const ratioLabels: Record<string, string> = {
  '1:1': 'Квадрат',
  '16:9': 'Широкий',
  '9:16': 'Вертикальный',
  '4:3': 'Альбомный',
  '3:4': 'Портретный',
};

export default function DynamicFormField({
  paramName,
  schema,
  value,
  onChange,
  required = false,
}: DynamicFormFieldProps) {
  // Determine component type
  const componentType = schema['x-component'] || inferComponentType(schema);

  // Render based on component type
  switch (componentType) {
    case 'textarea':
      return (
        <PromptInput
          value={value || ''}
          onChange={onChange}
        />
      );

    case 'image-upload':
      return (
        <ImageUploader
          label={schema.title}
          file={value}
          required={required}
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
              selected={value || schema.default || schema.enum[0]}
              onChange={onChange}
            />
          );
        }

        // Check if it's duration
        if (schema.type === 'integer' && paramName === 'duration') {
          return (
            <DurationSelector
              durations={schema.enum as number[]}
              selected={value || schema.default || schema.enum[0]}
              onChange={onChange}
            />
          );
        }

        // Check if it's resolution
        if (paramName === 'resolution' || schema.title.toLowerCase().includes('resolution')) {
          return (
            <ResolutionSelector
              resolutions={schema.enum as string[]}
              selected={value || schema.default || schema.enum[0]}
              onChange={onChange}
            />
          );
        }

        // Style selector for style_type
        if (paramName === 'style_type' || paramName === 'style') {
          return (
            <StyleSelector
              styles={schema.enum as string[]}
              selected={value || schema.default || schema.enum[0]}
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
              value={value || schema.default || ''}
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
            enabled={value !== undefined ? value : (schema.default as boolean || false)}
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
            value={value || ''}
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
            value={value || ''}
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
