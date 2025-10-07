import { showError, showSuccess } from '../utils/toast';

export function useImageDownload() {
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
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
