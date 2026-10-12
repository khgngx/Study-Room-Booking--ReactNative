import { clampOffset, clampZoom, cropRect, displayedSize } from '../crop';

// A 1200×800 landscape photo in a 200pt square viewport: at zoom 1 it is drawn 300×200.
const photo = { width: 1200, height: 800 };
const VIEWPORT = 200;

describe('displayedSize', () => {
  it('fits the shorter edge to the viewport at zoom 1', () => {
    expect(displayedSize(photo, VIEWPORT, 1)).toEqual({ width: 300, height: 200 });
    expect(displayedSize({ width: 800, height: 1200 }, VIEWPORT, 1)).toEqual({ width: 200, height: 300 });
  });

  it('scales with zoom', () => {
    expect(displayedSize(photo, VIEWPORT, 2)).toEqual({ width: 600, height: 400 });
  });
});

describe('clampOffset', () => {
  it('lets the image slide only along the edge that overflows', () => {
    expect(clampOffset({ x: 80, y: 30 }, photo, VIEWPORT, 1)).toEqual({ x: 50, y: 0 });
    expect(clampOffset({ x: -80, y: -30 }, photo, VIEWPORT, 1)).toEqual({ x: -50, y: -0 });
  });

  it('allows more travel when zoomed in', () => {
    expect(clampOffset({ x: 150, y: 90 }, photo, VIEWPORT, 2)).toEqual({ x: 150, y: 90 });
    expect(clampOffset({ x: 500, y: 500 }, photo, VIEWPORT, 2)).toEqual({ x: 200, y: 100 });
  });
});

describe('clampZoom', () => {
  it('stays between 1× and 3×', () => {
    expect(clampZoom(0.5)).toBe(1);
    expect(clampZoom(1.75)).toBe(1.75);
    expect(clampZoom(9)).toBe(3);
  });
});

describe('cropRect', () => {
  it('takes the centred square when nothing was moved', () => {
    expect(cropRect(photo, VIEWPORT, 1, { x: 0, y: 0 })).toEqual({ originX: 200, originY: 0, size: 800 });
  });

  it('moves against the drag: pulling the image right reveals its left side', () => {
    expect(cropRect(photo, VIEWPORT, 1, { x: 50, y: 0 })).toEqual({ originX: 0, originY: 0, size: 800 });
    expect(cropRect(photo, VIEWPORT, 1, { x: -50, y: 0 })).toEqual({ originX: 400, originY: 0, size: 800 });
  });

  it('shrinks the region when zoomed in', () => {
    expect(cropRect(photo, VIEWPORT, 2, { x: 0, y: 0 })).toEqual({ originX: 400, originY: 200, size: 400 });
    expect(cropRect(photo, VIEWPORT, 2, { x: 200, y: 100 })).toEqual({ originX: 0, originY: 0, size: 400 });
  });

  it('never reaches outside the image, even for an offset that was not clamped', () => {
    const rect = cropRect(photo, VIEWPORT, 2, { x: -9999, y: 9999 });
    expect(rect).toEqual({ originX: 800, originY: 0, size: 400 });
  });
});
