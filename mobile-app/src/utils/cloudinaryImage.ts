const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

export type CloudinaryVariant = "thumbnail" | "detail";

const VARIANT_TRANSFORMATIONS: Record<CloudinaryVariant, string> = {
  thumbnail: "f_auto,q_auto,w_400,h_400,c_fill,g_auto",
  detail: "f_auto,q_auto,w_1200,h_1200,c_limit",
};

export const getCloudinaryVariantUrl = (
  url: string,
  variant: CloudinaryVariant
): string => {
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("/upload/f_auto,")) return url;

  const uploadIdx = url.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIdx < 0) return url;

  const prefix = url.slice(0, uploadIdx + CLOUDINARY_UPLOAD_SEGMENT.length);
  const suffix = url.slice(uploadIdx + CLOUDINARY_UPLOAD_SEGMENT.length);

  return `${prefix}${VARIANT_TRANSFORMATIONS[variant]}/${suffix}`;
};

