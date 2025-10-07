/**
 * Utility functions for converting images to/from base64 for localStorage
 */

const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB to leave room for other data
const MAX_THUMBNAIL_WIDTH = 120; // Уменьшено для экономии localStorage
const MAX_THUMBNAIL_HEIGHT = 120; // Уменьшено для экономии localStorage
const JPEG_QUALITY = 0.6; // Только для thumbnail в истории, не влияет на скачивание

/**
 * Convert image URL to base64 string
 * Compresses image to save localStorage space
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(url);
    const blob = await response.blob();

    // Create image element to get dimensions and compress
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate thumbnail dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > MAX_THUMBNAIL_WIDTH || height > MAX_THUMBNAIL_HEIGHT) {
          const ratio = Math.min(
            MAX_THUMBNAIL_WIDTH / width,
            MAX_THUMBNAIL_HEIGHT / height
          );
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 JPEG for better compression
        const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Convert base64 string to blob URL
 */
export function base64ToImageUrl(base64: string): string {
  try {
    // Extract base64 data
    const base64Data = base64.split(',')[1];
    const mimeType = base64.match(/:(.*?);/)?.[1] || 'image/jpeg';

    // Convert to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create object URL
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error converting base64 to image URL:', error);
    return base64; // Return original if conversion fails
  }
}

/**
 * Check if adding data would exceed localStorage limit
 */
export function checkStorageLimit(dataSize: number): boolean {
  try {
    // Get current localStorage usage
    let currentSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        currentSize += localStorage[key].length + key.length;
      }
    }

    return (currentSize + dataSize) < MAX_STORAGE_SIZE;
  } catch (error) {
    console.error('Error checking storage limit:', error);
    return false;
  }
}

/**
 * Get current localStorage usage in bytes
 */
export function getStorageUsage(): number {
  try {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return 0;
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
