export interface IDiscordAuthor {
    name: string;
    icon_url: string;
    url?: string;
}

export interface IDiscordField {
    name: string;
    value: string;
    inline?: boolean;
}

export interface IDiscordEmbed {
    title?: string;
    author?: IDiscordAuthor;
    description: string;
    color: number;
    fields?: IDiscordField[];
    image? : {
        url: string;
    };
    timestamp?: Date;
}
