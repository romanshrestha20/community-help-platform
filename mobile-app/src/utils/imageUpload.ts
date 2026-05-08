import type { ImagePickerAsset } from "expo-image-picker";
// eslint-disable-next-line import/no-unresolved
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";

type PickedImage = {
  uri: string;
  name?: string;
  type?: string;
  webFile?: File | Blob;
};

const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.7;

const getResizeAction = (width?: number, height?: number) => {
  if (!width || !height) return null;

  const longestEdge = Math.max(width, height);
  if (longestEdge <= MAX_IMAGE_EDGE) return null;

  if (width >= height) {
    return {
      resize: {
        width: MAX_IMAGE_EDGE,
      },
    };
  }

  return {
    resize: {
      height: MAX_IMAGE_EDGE,
    },
  };
};

export const optimizePickedImage = async (
  asset: ImagePickerAsset,
  fallbackName: string
): Promise<PickedImage> => {
  const resizeAction = getResizeAction(asset.width, asset.height);

  const result = await manipulateAsync(
    asset.uri,
    resizeAction ? [resizeAction] : [],
    {
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    }
  );

  return {
    uri: result.uri,
    name: asset.fileName ?? fallbackName,
    type: "image/jpeg",
    webFile: (asset as any).file ?? undefined,
  };
};
