/**
 * File conversion utilities for Redux store serialization
 * Converts between File objects and base64 data URLs
 */

export interface ImageValue {
  dataUrl: string;
  name: string;
  type: string;
}

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: string;
}

/**
 * Compresses an image using Canvas API
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new File from compressed blob
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts a File object to a base64 data URL with metadata
 * Automatically compresses large images
 */
export async function fileToImageValue(
  file: File,
  options?: ImageCompressionOptions
): Promise<ImageValue> {
  // Check if image needs compression (> 1MB or explicit options provided)
  const shouldCompress = file.size > 1024 * 1024 || options !== undefined;

  let processedFile = file;

  if (shouldCompress && file.type.startsWith('image/')) {
    try {
      processedFile = await compressImage(file, options);
      console.log(
        `Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(processedFile.size / 1024).toFixed(1)}KB`
      );
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
      processedFile = file;
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        name: file.name,
        type: processedFile.type,
      });
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(processedFile);
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
  return Promise.all(files.map((file) => fileToImageValue(file)));
}

/**
 * Batch convert multiple ImageValues to Files
 */
export function imageValuesToFiles(imageValues: ImageValue[]): File[] {
  return imageValues.map(imageValueToFile);
}
