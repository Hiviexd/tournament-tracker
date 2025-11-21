import { IDiscordEmbed, IDiscordAuthor } from "../../../interfaces/Discord";

/**
 * Builder class for constructing Discord embeds with a fluent API
 */
export class EmbedBuilder {
    private embed: Partial<IDiscordEmbed> = {};

    constructor(initialEmbed?: Partial<IDiscordEmbed>) {
        if (initialEmbed) {
            this.embed = { ...initialEmbed };
        }
    }

    /**
     * Set the embed title
     */
    public setTitle(title: string): this {
        this.embed.title = title;
        return this;
    }

    /**
     * Set the embed description
     */
    public setDescription(description: string): this {
        this.embed.description = description;
        return this;
    }

    /**
     * Set the embed color (required for valid embed)
     */
    public setColor(color: number): this {
        this.embed.color = color;
        return this;
    }

    /**
     * Set the embed author
     */
    public setAuthor(author: IDiscordAuthor): this {
        this.embed.author = author;
        return this;
    }

    /**
     * Set the embed URL (makes title clickable)
     */
    public setUrl(url: string): this {
        this.embed.url = url;
        return this;
    }

    /**
     * Add a field to the embed
     */
    public addField(name: string, value: string, inline?: boolean): this {
        if (!this.embed.fields) {
            this.embed.fields = [];
        }
        this.embed.fields.push({ name, value, inline });
        return this;
    }

    /**
     * Set the embed footer
     */
    public setFooter(text: string, iconUrl?: string): this {
        this.embed.footer = { text, icon_url: iconUrl };
        return this;
    }

    /**
     * Set the embed image
     */
    public setImage(url: string): this {
        this.embed.image = { url };
        return this;
    }

    /**
     * Set the embed timestamp (defaults to current time if no argument provided)
     */
    public setTimestamp(timestamp?: Date): this {
        this.embed.timestamp = timestamp || new Date();
        return this;
    }

    /**
     * Build and return the embed object
     */
    public build(): IDiscordEmbed {
        if (this.embed.color === undefined) {
            throw new Error("Embed color is required");
        }
        return this.embed as IDiscordEmbed;
    }
}
