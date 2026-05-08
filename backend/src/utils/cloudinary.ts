import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

export const uploadImageToCloudinary = async (
    buffer: Buffer,
    folder: string
): Promise<{ url: string; publicId: string }> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                transformation: [
                    { width: 1600, height: 1600, crop: "limit" },
                    { quality: "auto:good" },
                    { fetch_format: "auto" },
                ],
            },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error("Image upload failed"));
                    return;
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
    });
};
