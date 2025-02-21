import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "../../config.json";

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
     */
    public async uploadFile(file: Express.Multer.File, ticketId: string): Promise<string> {
        const timestamp = Date.now();
        const fileName = `tcomm/tickets/${ticketId}/${timestamp}-${file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await this.client.send(command);
        return `${config.r2.baseUrl}/${fileName}`;
    }
}

export default new UploadService();
