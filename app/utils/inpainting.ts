export function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function saveMask(canvas: HTMLCanvasElement): string {
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  const finalCtx = finalCanvas.getContext('2d');

  if (finalCtx) {
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    const sourceCtx = canvas.getContext('2d');
    if (sourceCtx) {
      const imageData = sourceCtx.getImageData(0, 0, canvas.width, canvas.height);
      const newImageData = finalCtx.createImageData(canvas.width, canvas.height);
      const sourceData = imageData.data;
      const newData = newImageData.data;

      for (let i = 0; i < sourceData.length; i += 4) {
        if (sourceData[i + 3] > 0) {
          newData[i] = 0;
          newData[i + 1] = 0;
          newData[i + 2] = 0;
          newData[i + 3] = 255;
        } else {
          newData[i] = 255;
          newData[i + 1] = 255;
          newData[i + 2] = 255;
          newData[i + 3] = 255;
        }
      }

      finalCtx.putImageData(newImageData, 0, 0);
    }
  }

  return finalCanvas.toDataURL('image/png');
}
