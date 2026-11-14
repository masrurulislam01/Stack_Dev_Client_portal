const MAX_DIMENSION = 1024;
const MAX_DATA_URL_LENGTH = 340000;

export async function compressImageToDataUrl(file: File): Promise<string> {
  const lowerType = (file.type || '').toLowerCase();
  const lowerName = file.name.toLowerCase();
  if (!lowerType.startsWith('image/') || lowerType === 'image/svg+xml' || lowerName.endsWith('.svg')) {
    throw new Error(`"${file.name}" is not a supported raster image (PNG, JPG, WebP, GIF).`);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to read "${file.name}".`));
      image.src = objectUrl;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const targetWidth = Math.max(1, Math.round(img.width * scale));
    const targetHeight = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to process image attachment.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    for (const quality of [0.78, 0.62, 0.45]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_DATA_URL_LENGTH) {
        return dataUrl;
      }
    }

    throw new Error(`"${file.name}" is too large even after compression. Please pick a smaller image.`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
