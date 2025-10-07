/**
 * File conversion utilities for Redux store serialization
 * Converts between File objects and base64 data URLs
 */

export interface ImageValue {
  dataUrl: string;
  name: string;
  type: string;
}

/**
 * Converts a File object to a base64 data URL with metadata
 */
export async function fileToImageValue(file: File): Promise<ImageValue> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        name: file.name,
        type: file.type,
      });
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts a base64 data URL with metadata back to a File object
 */
export function imageValueToFile(imageValue: ImageValue): File {
  // Convert data URL to blob
  const byteString = atob(imageValue.dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([ab], { type: imageValue.type });

  // Create File from blob
  return new File([blob], imageValue.name, { type: imageValue.type });
}

/**
 * Batch convert multiple Files to ImageValues
 */
export async function filesToImageValues(files: File[]): Promise<ImageValue[]> {
  return Promise.all(files.map(fileToImageValue));
}

/**
 * Batch convert multiple ImageValues to Files
 */
export function imageValuesToFiles(imageValues: ImageValue[]): File[] {
  return imageValues.map(imageValueToFile);
}
