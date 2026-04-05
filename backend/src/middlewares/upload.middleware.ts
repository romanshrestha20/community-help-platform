import multer from "multer";

// Configure multer to store uploaded files in memory
const storage = multer.memoryStorage();

// Create the multer instance with the defined storage and file size limit
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image files are allowed"));
  },
});