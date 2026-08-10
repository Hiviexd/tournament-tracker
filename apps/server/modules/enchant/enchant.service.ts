import { Injectable } from "@nestjs/common";
import { EnchantSidebarService } from "../../services/EnchantSidebarService";

@Injectable()
export class EnchantService {
    constructor(private readonly enchantSidebarService: EnchantSidebarService) {}

    verifySignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
        return this.enchantSidebarService.verifySignature(rawBody, signature);
    }

    buildSidebarHtml(ticketId: string): Promise<string> {
        return this.enchantSidebarService.buildSidebarHtml(ticketId);
    }
}
