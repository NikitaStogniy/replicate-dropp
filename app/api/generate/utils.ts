import { ModelConfig } from '@/app/lib/models/types';

/**
 * Converts a File or base64 string to base64 data URL
 */
export async function toBase64DataUrl(
  input: File | string,
  type?: string
): Promise<string> {
  if (typeof input === 'string') {
    // Already a data URL or base64
    if (input.startsWith('data:')) return input;
    return input;
  }

  const buffer = Buffer.from(await input.arrayBuffer());
  const mimeType = type || input.type || 'image/png';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Builds API input from FormData and model schema
 */
export async function buildApiInput(
  formData: FormData,
  model: ModelConfig
): Promise<Record<string, string | number | string[] | boolean>> {
  const input: Record<string, string | number | string[] | boolean> = {};

  // Process each schema property
  for (const [schemaKey, schema] of Object.entries(model.schema.properties)) {
    const apiField = schema['x-api-field'] || schemaKey;
    const formKey = apiField;

    // Handle array types (like image_input)
    if (schema.type === 'array' && schema.items?.format === 'uri') {
      const count = formData.get(`${formKey}_count`);
      if (count) {
        const items: string[] = [];
        for (let i = 0; i < parseInt(count as string, 10); i++) {
          const dataUrl = formData.get(`${formKey}_${i}_dataUrl`) as string;
          if (dataUrl) items.push(dataUrl);
        }
        if (items.length > 0) input[apiField] = items;
      }
      continue;
    }

    // Handle File uploads (format: uri)
    if (schema.format === 'uri') {
      const file = formData.get(formKey) as File | null;
      if (file) {
        input[apiField] = await toBase64DataUrl(file);
      }
      continue;
    }

    // Handle other types
    const value = formData.get(formKey);
    if (value === null || value === undefined || value === '') continue;

    switch (schema.type) {
      case 'integer':
        input[apiField] = parseInt(value as string, 10);
        break;
      case 'number':
        input[apiField] = parseFloat(value as string);
        break;
      case 'boolean':
        input[apiField] = value === 'true';
        break;
      case 'string':
        input[apiField] = value as string;
        break;
    }
  }

  // Post-processing: Fix aspect_ratio if match_input_image is used without image_input
  if (input.aspect_ratio === 'match_input_image' && !input.image_input) {
    input.aspect_ratio = '1:1';
  }

  return input;
}

/**
 * Extract URL from FileOutput or similar object
 */
function tryGetUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;

  // Try calling .url() method (FileOutput from Replicate SDK)
  try {
    const urlMethod = (obj as Record<string, unknown>).url;
    if (typeof urlMethod === 'function') {
      const result = urlMethod.call(obj);
      if (typeof result === 'string' && result.startsWith('http')) {
        return result;
      }
    }
  } catch {
    // Method call failed
  }

  // Try toString() method (FileOutput also supports this)
  try {
    const toStringMethod = (obj as Record<string, unknown>).toString;
    if (typeof toStringMethod === 'function') {
      const result = toStringMethod.call(obj);
      if (typeof result === 'string' && result.startsWith('http')) {
        return result;
      }
    }
  } catch {
    // Method call failed
  }

  // Try accessing .url property
  try {
    const urlProp = (obj as Record<string, unknown>).url;
    if (typeof urlProp === 'string' && urlProp.startsWith('http')) {
      return urlProp;
    }
  } catch {
    // Property access failed
  }

  // Try .href property (URL object)
  try {
    const hrefProp = (obj as Record<string, unknown>).href;
    if (typeof hrefProp === 'string' && hrefProp.startsWith('http')) {
      return hrefProp;
    }
  } catch {
    // Property access failed
  }

  return null;
}

/**
 * Process Replicate output to ensure consistent format
 */
export async function processReplicateOutput(
  output: unknown,
  _isVideoModel?: boolean
): Promise<string | string[]> {
  console.log('=== processReplicateOutput ===');
  console.log('Output type:', typeof output);
  console.log('Output constructor:', output?.constructor?.name);
  console.log('Output keys:', output && typeof output === 'object' ? Object.keys(output) : 'N/A');

  // Try to extract URL from FileOutput or similar object
  const extractedUrl = tryGetUrl(output);
  if (extractedUrl) {
    console.log('Extracted URL:', extractedUrl);
    return extractedUrl;
  }

  // URL object (common for video models)
  if (output instanceof URL) {
    return output.href;
  }

  // Direct URL or data URL
  if (typeof output === 'string') {
    if (output.startsWith('http') || output.startsWith('data:')) {
      return output;
    }

    // Binary PNG data
    if (output.startsWith('\x89PNG')) {
      const buffer = Buffer.from(output, 'binary');
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
  }

  // Array of outputs (may contain FileOutput objects)
  if (Array.isArray(output)) {
    const processed = await Promise.all(
      output.map(async (item) => {
        // Try to extract URL from item
        const itemUrl = tryGetUrl(item);
        if (itemUrl) return itemUrl;

        if (typeof item === 'string' && (item.startsWith('http') || item.startsWith('data:'))) {
          return item;
        }

        if (item && typeof item === 'object' && 'getReader' in item) {
          return await streamToBase64(item as ReadableStream);
        }

        return item;
      })
    );
    return processed.length === 1 ? processed[0] : processed;
  }

  // ReadableStream - check if it's a FileOutput first
  if (output && typeof output === 'object' && 'getReader' in output) {
    console.log('Got ReadableStream, checking for FileOutput methods...');
    // Last attempt: maybe url is in prototype chain
    try {
      // @ts-expect-error - trying to access url method from FileOutput
      if (typeof output.url === 'function') {
        // @ts-expect-error - calling url method
        const url = output.url();
        if (typeof url === 'string' && url.startsWith('http')) {
          console.log('Found URL via prototype:', url);
          return url;
        }
      }
    } catch (e) {
      console.log('FileOutput url() failed:', e);
    }

    // If no URL found, convert to base64
    return await streamToBase64(output as ReadableStream);
  }

  return output as string;
}

/**
 * Convert ReadableStream to base64 data URL
 */
async function streamToBase64(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const buffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  const base64 = Buffer.from(buffer).toString('base64');

  // Определяем MIME тип по магическим байтам
  const mimeType = detectImageMimeType(buffer);

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Определяет MIME тип изображения по магическим байтам
 */
function detectImageMimeType(buffer: Uint8Array): string {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }

  // По умолчанию PNG (для обратной совместимости)
  return 'image/png';
}

/**
 * Generate or validate seed value
 */
export function handleSeed(seedParam: string | null): number {
  if (seedParam && seedParam.trim() && !isNaN(Number(seedParam))) {
    return parseInt(seedParam, 10);
  }
  return Math.floor(Math.random() * 1000000000);
}
