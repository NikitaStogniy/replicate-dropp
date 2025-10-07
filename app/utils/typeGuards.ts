/**
 * Type guard utilities for better type safety
 */

import type { ImageValue } from './fileConversion';
import type { ImageInputItem } from '../store/slices/generatorSlice';

/**
 * Type guard to check if value is ImageValue
 */
export function isImageValue(value: unknown): value is ImageValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dataUrl' in value &&
    'name' in value &&
    'type' in value &&
    typeof (value as ImageValue).dataUrl === 'string' &&
    typeof (value as ImageValue).name === 'string' &&
    typeof (value as ImageValue).type === 'string'
  );
}

/**
 * Type guard to check if value is ImageInputItem (alias for ImageValue)
 */
export function isImageInputItem(value: unknown): value is ImageInputItem {
  return isImageValue(value);
}

/**
 * Type guard to check if value is ImageInputItem array
 */
export function isImageInputItemArray(value: unknown): value is ImageInputItem[] {
  return Array.isArray(value) && value.every(isImageInputItem);
}

/**
 * Type guard to check if value is File object
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
