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
          return await streamToBase64(item as ReadableStream);
        }

        return item;
      })
    );
    return processed.length === 1 ? processed[0] : processed;
  }

  // ReadableStream
  if (output && typeof output === 'object' && 'getReader' in output) {
    if (isVideoModel) {
      return output as unknown as string; // Return as-is for video
    }
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
  return `data:image/png;base64,${base64}`;
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
