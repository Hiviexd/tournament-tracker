import { Module } from "@nestjs/common";
import { UploadService } from "../../services/UploadService";

@Module({
    providers: [UploadService],
    exports: [UploadService],
})
export class UploadModule {}
