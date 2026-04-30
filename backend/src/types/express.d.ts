import type { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tokenVersion: number;
      };
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };

    }
  }
}

export { };
