import { useCallback } from 'react';

export function useCanvasDrawing(brushSize: number, isDrawing: boolean) {
  const handleMouseDrawing = useCallback(
    (canvas: HTMLCanvasElement, e: React.MouseEvent) => {
      if (!isDrawing) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, (brushSize / 2) * scaleX, 0, 2 * Math.PI);
      ctx.fill();
    },
    [brushSize, isDrawing]
  );

  const handleTouchDrawing = useCallback(
    (canvas: HTMLCanvasElement, touch: React.Touch) => {
      if (!isDrawing) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, (brushSize / 2) * scaleX, 0, 2 * Math.PI);
      ctx.fill();
    },
    [brushSize, isDrawing]
  );

  return {
    handleMouseDrawing,
    handleTouchDrawing,
  };
}
