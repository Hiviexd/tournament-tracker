import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "../../config.json";
import { IAttachment } from "../../interfaces/Attachment";

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
     * @returns URL of the uploaded file
     */
    private async uploadFile(file: Express.Multer.File, category: string, categoryObjectId: string): Promise<string> {
        const timestamp = Date.now();
        const fileName = `${config.r2.baseFolder}/${category}/${categoryObjectId}/${timestamp}-${file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await this.client.send(command);
        return `${config.r2.baseUrl}/${fileName}`;
    }

    /**
     * Handle file uploads and return attachment metadata
     * @param files Files to upload
     * @param category Category of the files (e.g. tickets, votings)
     * @param categoryObjectId ID of the category object (e.g. ticket ID, voting ID)
     * @returns Array of attachment metadata
     * @throws Error if file upload fails
     */
    public async handleFileUploads(files: Express.Multer.File[], category: string, categoryObjectId: string): Promise<IAttachment[]> {
        if (!files?.length) return [];

        try {
            const uploadPromises = files.map(async (file) => {
                try {
                    const url = await this.uploadFile(file, category, categoryObjectId);
                    return {
                        originalName: file.originalname,
                        url,
                        size: file.size,
                        type: file.mimetype,
                    };
                } catch (error) {
                    throw new Error(`Failed to upload file ${file.originalname}`);
                }
            });

            // Wait for all uploads to complete
            const attachments = await Promise.all(uploadPromises);

            // Validate all attachments have URLs
            if (attachments.some((attachment) => !attachment.url)) {
                throw new Error("One or more file uploads failed to generate URLs");
            }

            return attachments;
        } catch (error) {
            throw new Error(`File upload failed`);
        }
    }
}

export default new UploadService();
