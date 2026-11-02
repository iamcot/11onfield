/**
 * Pure helpers of the photo cropper (avatar and full-body photo).
 * A crop box is kept in fractions of the image (0..1), so it does not depend on how big the picture is drawn.
 */
export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se';

/** Smallest box side, as a fraction of the image side. */
export const MIN_SIDE = 0.08;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The box the cropper opens with. aspect = width / height in pixels, or null for a free box.
 * A square (avatar) sits a bit above the middle, where the face usually is; a free box (full body) takes
 * a portrait strip in the middle of the picture.
 */
export function initialBox(imgW: number, imgH: number, aspect: number | null): CropBox {
  if (aspect) {
    // largest box of that aspect that fits in 80% of the picture
    let wPx = imgW * 0.8;
    let hPx = wPx / aspect;
    if (hPx > imgH * 0.8) {
      hPx = imgH * 0.8;
      wPx = hPx * aspect;
    }
    const w = wPx / imgW;
    const h = hPx / imgH;
    return { x: (1 - w) / 2, y: clamp((1 - h) / 2 - 0.08, 0, 1 - h), w, h };
  }
  const hPx = imgH * 0.92;
  const wPx = Math.min(imgW * 0.9, Math.max(hPx * 0.55, imgW * 0.5));
  const w = wPx / imgW;
  const h = hPx / imgH;
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

/**
 * Moves or resizes a box by a pointer delta (dx, dy in fractions of the image) from the box at drag start.
 * Corners resize from the opposite corner; with an aspect the height follows the width.
 */
export function dragBox(start: CropBox, handle: Handle, dx: number, dy: number, imgW: number, imgH: number, aspect: number | null): CropBox {
  if (handle === 'move') {
    return { ...start, x: clamp(start.x + dx, 0, 1 - start.w), y: clamp(start.y + dy, 0, 1 - start.h) };
  }
  const left = handle === 'nw' || handle === 'sw';
  const top = handle === 'nw' || handle === 'ne';
  // the fixed corner
  const ax = left ? start.x + start.w : start.x;
  const ay = top ? start.y + start.h : start.y;
  // room between the fixed corner and the picture edge on the dragged side
  const roomW = left ? ax : 1 - ax;
  const roomH = top ? ay : 1 - ay;
  let w = clamp(start.w + (left ? -dx : dx), MIN_SIDE, roomW);
  let h = clamp(start.h + (top ? -dy : dy), MIN_SIDE, roomH);
  if (aspect) {
    // h in fractions for the width w, in pixels w*imgW / aspect
    const ratio = imgW / (aspect * imgH);
    h = w * ratio;
    if (h > roomH) {
      h = roomH;
      w = h / ratio;
    }
    if (h < MIN_SIDE) {
      h = MIN_SIDE;
      w = h / ratio;
    }
  }
  return { x: left ? ax - w : ax, y: top ? ay - h : ay, w, h };
}

/** Output size in pixels of the cropped part, the long side at most maxEdge (never enlarged). */
export function outputSize(box: CropBox, imgW: number, imgH: number, maxEdge: number): { sx: number; sy: number; sw: number; sh: number; ow: number; oh: number } {
  const sx = Math.round(box.x * imgW);
  const sy = Math.round(box.y * imgH);
  const sw = Math.max(1, Math.round(box.w * imgW));
  const sh = Math.max(1, Math.round(box.h * imgH));
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  return { sx, sy, sw, sh, ow: Math.max(1, Math.round(sw * scale)), oh: Math.max(1, Math.round(sh * scale)) };
}
