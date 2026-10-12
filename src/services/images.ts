import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { CropRect } from '../domain/crop';

// A picked photo is stored by file name, not by full path: iOS moves the app's document folder between installs.
const LOCAL_PREFIX = 'local:';
const IMAGE_FOLDER = 'images';

export type ImageKind = 'avatar' | 'room';

const SPEC: Record<ImageKind, { aspect: [number, number]; maxEdge: number }> = {
  avatar: { aspect: [1, 1], maxEdge: 400 },
  room: { aspect: [4, 3], maxEdge: 800 },
};
const JPEG_QUALITY = 0.7;

/** A photo the user chose but that has not been kept yet. */
export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

/** In-app cropping redraws the pixels on a canvas, which only the web build has. Native crops in the system editor. */
export const CAN_CROP_IN_APP = Platform.OS === 'web';

/** Web has no file system: the photo is cropped, shrunk and kept inline, small enough for browser storage. */
function renderToDataUrl(source: string, maxEdge: number, crop?: CropRect): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const region = crop
        ? { x: crop.originX, y: crop.originY, width: crop.size, height: crop.size }
        : { x: 0, y: 0, width: image.width, height: image.height };
      const scale = Math.min(1, maxEdge / Math.max(region.width, region.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(region.width * scale);
      canvas.height = Math.round(region.height * scale);
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas is unavailable, cannot resize the picked image'));
        return;
      }
      context.drawImage(image, region.x, region.y, region.width, region.height, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    image.onerror = () => reject(new Error('The picked file could not be read as an image'));
    image.src = source;
  });
}

/**
 * Opens the photo library. Nothing is kept until `storeImage`; null means the picker was dismissed.
 * `cropInApp` skips the system crop step because the caller shows its own crop grid.
 */
export async function chooseImage(kind: ImageKind, { cropInApp = false } = {}): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: !(cropInApp && CAN_CROP_IN_APP),
    aspect: SPEC[kind].aspect,
    quality: JPEG_QUALITY,
  });
  if (result.canceled) return null;
  const [asset] = result.assets;
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

/** Keeps a copy of a chosen photo and returns the value to store on the user or room. `crop` applies where `CAN_CROP_IN_APP`. */
export async function storeImage(kind: ImageKind, picked: PickedImage, crop?: CropRect): Promise<string> {
  if (Platform.OS === 'web') return renderToDataUrl(picked.uri, SPEC[kind].maxEdge, crop);

  const folder = new Directory(Paths.document, IMAGE_FOLDER);
  if (!folder.exists) folder.create({ intermediates: true });
  const source = new File(picked.uri);
  const name = `${kind}-${Date.now()}${source.extension || '.jpg'}`;
  await source.copy(new File(folder, name));
  return `${LOCAL_PREFIX}${name}`;
}

/** Chooses and keeps a photo in one step, for callers without their own preview. */
export async function pickImage(kind: ImageKind): Promise<string | null> {
  const picked = await chooseImage(kind);
  return picked ? storeImage(kind, picked) : null;
}

/** Turns a stored image value into something an `<Image>` can load. */
export function resolveImage(value: string | undefined): string | undefined {
  if (!value?.startsWith(LOCAL_PREFIX)) return value;
  return new File(Paths.document, IMAGE_FOLDER, value.slice(LOCAL_PREFIX.length)).uri;
}

/** Deletes the file behind a stored value once nothing points at it. Remote and inline images need no cleanup. */
export function discardImage(value: string | undefined): void {
  if (!value?.startsWith(LOCAL_PREFIX)) return;
  const file = new File(Paths.document, IMAGE_FOLDER, value.slice(LOCAL_PREFIX.length));
  if (file.exists) file.delete();
}
