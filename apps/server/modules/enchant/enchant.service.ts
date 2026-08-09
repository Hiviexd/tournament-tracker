import { Injectable } from "@nestjs/common";
import EnchantSidebarService from "../../services/EnchantSidebarService";

@Injectable()
export class EnchantService {
    verifySignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
        return EnchantSidebarService.verifySignature(rawBody, signature);
    }

    buildSidebarHtml(ticketId: string): Promise<string> {
        return EnchantSidebarService.buildSidebarHtml(ticketId);
    }
}
