import multer from "multer";
import { Request, Response, NextFunction } from "express";

export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 5,
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "application/zip",
            "application/x-zip",
            "application/x-zip-compressed",
            "application/octet-stream",
            "application/x-rar-compressed",
            "text/plain",
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error("Invalid file type"));
            return;
        }
        cb(null, true);
    },
}).array("files", 5);

export const handleUpload = (req: Request, res: Response, next: NextFunction): void => {
    uploadMiddleware(req, res, (err) => {
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
