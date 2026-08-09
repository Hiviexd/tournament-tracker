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
    url?: string;
    author?: IDiscordAuthor;
    description?: string;
    color: number;
    fields?: IDiscordField[];
    image?: {
        url: string;
    };
    timestamp?: Date;
    footer?: {
        text: string;
        icon_url?: string;
    };
}

interface IBaseWebhookParams {
    embeds: IDiscordEmbed[];
    message?: string;
    threadId?: string;
    webhook?: string;
}

export interface ISendWebhookParams extends IBaseWebhookParams {
    notification?: "silent" | "normal";
}

export interface IUserHighlightWebhookParams extends IBaseWebhookParams {
    users: string[];
}

export interface IRoleHighlightWebhookParams extends IBaseWebhookParams {
    roles: string[];
}
