export interface IDiscordEmbed {
    title?: string;
    author?: {
        name: string;
        icon_url: string;
        url?: string;
    };
    description: string;
    color: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    image? : {
        url: string;
    };
    timestamp?: Date;
}
