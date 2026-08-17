import { useState } from "react";

export interface UseFileUploadOptions {
    maxFiles?: number;
    maxSize?: number; // in bytes
    allowedTypes?: string[];
}

const defaultOptions = {
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
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

export function useFileUpload(options: UseFileUploadOptions = {}) {
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { maxFiles, maxSize, allowedTypes } = { ...defaultOptions, ...options };

    const validateFiles = (files: File[]): string | null => {
        if (files.length > maxFiles) return `Maximum ${maxFiles} files allowed`;

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) return "Invalid file type. Allowed: jpg, png, zip, rar, txt";
            if (file.size > maxSize) return `Files must be under ${maxSize / 1024 / 1024}MB`;
        }

        return null;
    };

    const handleFileChange = (newFiles: File[]) => {
        const validationError = validateFiles(newFiles);
        if (validationError) {
            setError(validationError);
            return false;
        }
        setError(null);
        setFiles(newFiles);
        return true;
    };

    const clearFiles = () => {
        setFiles([]);
        setError(null);
    };

    return {
        files,
        error,
        handleFileChange,
        clearFiles,
    };
}
