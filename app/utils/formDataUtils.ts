import { ModelConfig } from '@/app/lib/models/types';
import { imageValueToFile } from './fileConversion';
import { isImageValue, isImageInputItemArray, isFile, isString, isNumber, isBoolean } from './typeGuards';

/**
 * Converts UI parameters to FormData based on model schema
 */
export function schemaToFormData(
  model: ModelConfig,
  parameters: Record<string, unknown>
): FormData {
  const formData = new FormData();

  Object.entries(model.schema.properties).forEach(([schemaKey, schema]) => {
    const uiField = schema['x-ui-field'] || schemaKey;
    const apiField = schema['x-api-field'] || schemaKey;
    const value = parameters[uiField];

    // Skip empty values
    if (value === undefined || value === null || value === '') return;

    // Handle array types (like image_input)
    if (schema.type === 'array' && isImageInputItemArray(value)) {
      if (schema.items?.format === 'uri') {
        // Special handling for ImageInputItem[]
        value.forEach((item, index) => {
          formData.append(`${apiField}_${index}_dataUrl`, item.dataUrl);
          formData.append(`${apiField}_${index}_name`, item.name);
          formData.append(`${apiField}_${index}_type`, item.type);
        });
        formData.append(`${apiField}_count`, value.length.toString());
      }
      return;
    }

    // Handle ImageValue (convert to File)
    if (isImageValue(value)) {
      const file = imageValueToFile(value);
      formData.append(apiField, file);
      return;
    }

    // Handle File uploads (legacy support)
    if (isFile(value)) {
      formData.append(apiField, value);
      return;
    }

    // Handle primitives
    if (isString(value)) {
      formData.append(apiField, value);
    } else if (isNumber(value)) {
      formData.append(apiField, value.toString());
    } else if (isBoolean(value)) {
      formData.append(apiField, value.toString());
    }
  });

  return formData;
}
