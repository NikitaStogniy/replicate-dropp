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
 * Process Replicate output to ensure consistent format
 */
export async function processReplicateOutput(
  output: unknown,
  isVideoModel: boolean
): Promise<string | string[]> {
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

  // Array of outputs
  if (Array.isArray(output)) {
    const processed = await Promise.all(
      output.map(async (item) => {
        if (typeof item === 'string' && (item.startsWith('http') || item.startsWith('data:'))) {
          return item;
        }

        if (item && typeof item === 'object' && 'getReader' in item) {
          return await streamToDataUrl(item as ReadableStream, isVideoModel);
        }

        return item;
      })
    );
    return processed.length === 1 ? processed[0] : processed;
  }

  // ReadableStream
  if (output && typeof output === 'object' && 'getReader' in output) {
    return await streamToDataUrl(output as ReadableStream, isVideoModel);
  }

  return output as string;
}

/**
 * Convert ReadableStream to base64 data URL
 */
async function streamToDataUrl(stream: ReadableStream, isVideo: boolean = false): Promise<string> {
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
  const mimeType = isVideo ? detectVideoMimeType(buffer) : detectImageMimeType(buffer);

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
 * Определяет MIME тип видео по магическим байтам
 */
function detectVideoMimeType(buffer: Uint8Array): string {
  // MP4: starts with ftyp at offset 4
  if (buffer.length >= 12 &&
      buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return 'video/mp4';
  }

  // WebM: 1A 45 DF A3
  if (buffer.length >= 4 &&
      buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
    return 'video/webm';
  }

  // AVI: 52 49 46 46 ... 41 56 49 20
  if (buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x41 && buffer[9] === 0x56 && buffer[10] === 0x49 && buffer[11] === 0x20) {
    return 'video/avi';
  }

  // По умолчанию MP4
  return 'video/mp4';
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
