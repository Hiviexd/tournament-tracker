import multer from "multer";
import { Request, Response, NextFunction } from "express";

interface UploadOptions {
    maxFiles?: number;
    allowedTypes?: string[];
    maxFileSize?: number;
}

const defaultOptions: UploadOptions = {
    maxFiles: 5,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
        "image/jpeg",
        "image/png",
        "application/zip",
        "application/x-zip",
        "application/x-zip-compressed",
        "application/octet-stream",
        "application/x-rar-compressed",
        "text/plain",
    ],
};

export const createUploadMiddleware = (options: UploadOptions = {}) => {
    const finalOptions = { ...defaultOptions, ...options };

    const middleware = multer({
        storage: multer.memoryStorage(),
        limits: {
            files: finalOptions.maxFiles,
            fileSize: finalOptions.maxFileSize,
        },
        fileFilter: (_req, file, cb) => {
            if (!finalOptions.allowedTypes?.includes(file.mimetype)) {
                cb(new Error("Invalid file type"));
                return;
            }
            cb(null, true);
        },
    }).array("files", finalOptions.maxFiles);

    return (req: Request, res: Response, next: NextFunction): void => {
        // SAFETY: multer's handler requires Response.locals; this app's Response.locals is optional.
        middleware(req, res as never, (err) => {
            if (err instanceof multer.MulterError) {
                res.status(400).json({ error: `Upload error: ${err.message}` });
                return;
            } else if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            next();
        });
    };
};

// For backward compatibility
export const handleUpload = createUploadMiddleware();
