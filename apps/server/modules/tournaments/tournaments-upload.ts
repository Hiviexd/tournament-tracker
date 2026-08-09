import { BadRequestException } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Request } from "express";
import { resolveUploadOptions, type UploadOptions } from "../../middlewares/upload";

/** Nest FilesInterceptor matching createUploadMiddleware memory storage limits. */
export function createFilesInterceptor(options: UploadOptions = {}) {
    const finalOptions = resolveUploadOptions(options);

    return FilesInterceptor("files", finalOptions.maxFiles, {
        storage: memoryStorage(),
        limits: {
            files: finalOptions.maxFiles,
            fileSize: finalOptions.maxFileSize,
        },
        fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
            if (!finalOptions.allowedTypes?.includes(file.mimetype)) {
                cb(new BadRequestException("Invalid file type") as unknown as Error, false);
                return;
            }
            cb(null, true);
        },
    });
}

export const tournamentBadgeFilesInterceptor = createFilesInterceptor({
    maxFiles: 8,
    allowedTypes: ["image/jpeg", "image/png"],
});

export const defaultFilesInterceptor = createFilesInterceptor();
