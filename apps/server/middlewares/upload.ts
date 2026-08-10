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

export type { UploadOptions };

export function resolveUploadOptions(options: UploadOptions = {}) {
    return { ...defaultOptions, ...options };
}
