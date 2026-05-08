import type { ImagePickerAsset } from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

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

  const context = ImageManipulator.manipulate(asset.uri);
  if (resizeAction?.resize) {
    context.resize(resizeAction.resize);
  }

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    name: asset.fileName ?? fallbackName,
    type: "image/jpeg",
    webFile: (asset as any).file ?? undefined,
  };
};
