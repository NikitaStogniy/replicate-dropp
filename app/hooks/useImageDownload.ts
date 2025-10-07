import { showError, showSuccess } from '../utils/toast';

export function useImageDownload() {
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Определяем желаемый формат из расширения файла
      const extension = filename.split('.').pop()?.toLowerCase();
      let finalBlob = blob;

      // Если нужен JPG, но пришел PNG - конвертируем
      if (extension === 'jpg' || extension === 'jpeg') {
        finalBlob = await convertToJpeg(blob);
      }

      const url = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Изображение успешно скачано');
    } catch (error) {
      console.error('Ошибка при скачивании изображения:', error);
      showError('Ошибка при скачивании изображения');
    }
  };

  return { downloadImage };
}

async function convertToJpeg(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Белый фон для JPG (так как JPG не поддерживает прозрачность)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (newBlob) => {
          URL.revokeObjectURL(url);
          if (newBlob) {
            resolve(newBlob);
          } else {
            reject(new Error('Failed to convert image to JPEG'));
          }
        },
        'image/jpeg',
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
