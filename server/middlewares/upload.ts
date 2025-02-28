import multer from "multer";
import { Request, Response, NextFunction } from "express";

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/zip",
    "application/x-zip",
    "application/x-zip-compressed",
    "application/octet-stream",
    "application/x-rar-compressed",
    "text/plain",
    "application/json",
];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!allowedTypes.includes(file.mimetype)) {
        cb(new Error("Invalid file type"));
        return;
    }
    cb(null, true);
};

export const uploadMiddleware = multer({
    storage: multer.diskStorage({
        destination: "/tmp",
        filename: (_req, _file, cb) => {
            cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9));
        },
    }),
    limits: {
        files: 5,
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter,
}).fields([
    { name: "files", maxCount: 5 },
    { name: "file", maxCount: 1 },
]);

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
