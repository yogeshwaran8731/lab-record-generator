export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageFilters {
  invert?: boolean;
  contrast?: number; // 1 = normal, 1.2 = high
}

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crops and rotates an image using an offscreen canvas and returns a PNG Data URL.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  filters: ImageFilters = {}
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate to center for rotation
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Apply visual filters if requested
  const filterList: string[] = [];
  if (filters.invert) {
    filterList.push('invert(100%)');
  }
  if (filters.contrast && filters.contrast !== 1) {
    filterList.push(`contrast(${filters.contrast * 100}%)`);
  }
  if (filterList.length > 0) {
    ctx.filter = filterList.join(' ');
  }

  // Draw the rotated image
  ctx.drawImage(image, 0, 0);

  // Create crop canvas
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');

  if (!cropCtx) {
    throw new Error('Crop canvas 2D context not available');
  }

  cropCanvas.width = pixelCrop.width;
  cropCanvas.height = pixelCrop.height;

  // Draw cropped slice
  cropCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return cropCanvas.toDataURL('image/png');
}

/**
 * Converts a base64 Data URL into a Uint8Array and retrieves pixel dimensions.
 */
export async function parseDataUrlImage(
  dataUrl: string
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  // If running in browser, measure with Image
  let width = 500;
  let height = 300;

  if (typeof window !== 'undefined') {
    try {
      const img = await createImage(dataUrl);
      width = img.naturalWidth || img.width || 500;
      height = img.naturalHeight || img.height || 300;
    } catch (e) {
      console.warn('Could not read image dimensions:', e);
    }
  }

  // Decode base64 to Uint8Array
  const base64Index = dataUrl.indexOf(',');
  const base64 = base64Index >= 0 ? dataUrl.slice(base64Index + 1) : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return { bytes, width, height };
}
