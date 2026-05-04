import { create } from "zustand";

type OverlayState = {
  imagePreviewVisible: boolean;
  setImagePreviewVisible: (visible: boolean) => void;
};

export const useOverlayStore = create<OverlayState>((set) => ({
  imagePreviewVisible: false,
  setImagePreviewVisible: (visible) => set({ imagePreviewVisible: visible }),
}));
