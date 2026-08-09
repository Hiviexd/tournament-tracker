import { createFilesInterceptor, defaultFilesInterceptor } from "../common/upload.interceptors";

export { createFilesInterceptor, defaultFilesInterceptor };

export const tournamentBadgeFilesInterceptor = createFilesInterceptor({
    maxFiles: 8,
    allowedTypes: ["image/jpeg", "image/png"],
});
