import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "@tc/config";
import { IAttachment } from "@tc/types/Attachment";
import utils from "@tc/utils/server";
import Attachment from "../models/attachmentModel";

class UploadService {
    private client: S3Client;

    constructor() {
        this.client = new S3Client({
            region: "auto",
            endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: config.r2.accessKeyId,
                secretAccessKey: config.r2.secretAccessKey,
            },
        });
    }

    /**
     * Upload a file to R2 storage with proper ticket path
     * @param file File to upload
     * @param category Category of the file (e.g. tickets, votings)
     * @param categoryObjectId ID of the category object (e.g. ticket ID, voting ID)
     * @returns URL and sanitized filename of the uploaded file
     */
    private async uploadFile(
        file: Express.Multer.File,
        category: string,
        categoryObjectId: string,
    ): Promise<{ url: string; filename: string }> {
        const timestamp = Date.now();
        const { ascii: filename } = utils.sanitizeFilename(file.originalname);
        const filePath = `${config.r2.baseFolder}/${category}/${categoryObjectId}/${timestamp}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: filePath,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await this.client.send(command);

        return { url: `${config.r2.baseUrl}/${filePath}`, filename };
    }

    /**
     * Handle file uploads and return attachment metadata
     * @param files Files to upload
     * @param category Category of the files (e.g. tickets, votings)
     * @param categoryObjectId ID of the category object (e.g. ticket ID, voting ID)
     * @param userId ID of the user uploading the files
     * @returns Array of attachment metadata
     * @throws Error if file upload fails
     */
    public async handleFileUploads(
        files: Express.Multer.File[],
        category: string,
        categoryObjectId: string,
        userId: string,
    ): Promise<IAttachment[]> {
        if (!files?.length) return [];

        try {
            const uploadPromises = files.map(async (file) => {
                try {
                    const { url, filename } = await this.uploadFile(file, category, categoryObjectId);

                    const attachment = new Attachment({
                        originalName: filename,
                        url,
                        size: file.size,
                        type: file.mimetype,
                        category,
                        categoryObjectId,
                        uploadedBy: userId,
                    });

                    await attachment.save();
                    return attachment;
                } catch {
                    throw new Error(`Failed to upload file ${file.originalname}`);
                }
            });

            const attachments = await Promise.all(uploadPromises);
            return attachments;
        } catch {
            throw new Error(`File upload failed`);
        }
    }
}

export default new UploadService();
