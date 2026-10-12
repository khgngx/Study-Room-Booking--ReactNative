export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** A square region of the source image, in source pixels. */
export interface CropRect {
  originX: number;
  originY: number;
  size: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

/** How large the image is drawn so that, at zoom 1, its shorter edge exactly fills the square viewport. */
export function displayedSize(image: Size, viewport: number, zoom: number): Size {
  const scale = (viewport / Math.min(image.width, image.height)) * zoom;
  return { width: image.width * scale, height: image.height * scale };
}

/** Keeps the image covering the viewport: `offset` is how far its centre sits from the viewport's centre. */
export function clampOffset(offset: Point, image: Size, viewport: number, zoom: number): Point {
  const shown = displayedSize(image, viewport, zoom);
  const maxX = (shown.width - viewport) / 2;
  const maxY = (shown.height - viewport) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** The part of the source image that is inside the viewport, for the given pan and zoom. */
export function cropRect(image: Size, viewport: number, zoom: number, offset: Point): CropRect {
  const scale = displayedSize(image, viewport, zoom).width / image.width;
  const size = viewport / scale;
  const { x, y } = clampOffset(offset, image, viewport, zoom);
  return {
    originX: (image.width - size) / 2 - x / scale,
    originY: (image.height - size) / 2 - y / scale,
    size,
  };
}
