import type { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };

    }
  }
}

export { };