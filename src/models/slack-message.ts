export class SlackMessagePostBody {
    channel: string;
    text?: string;
    username?: string;
    icon_url?: string;
    icon_emoji?: string;
    blocks?: any[];
}

export class SlackEphemeralMessagePostBody {
    channel: string;
    text?: string;
    username?: string;
    icon_url?: string;
    icon_emoji?: string;
    blocks?: any[];
    user: string;
}

export class SlackUpdateMessagePostBody {
    channel: string;
    text?: string;
    username?: string;
    icon_url?: string;
    icon_emoji?: string;
    blocks?: any[];
    ts: string;
}