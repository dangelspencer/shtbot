export class SlackMessagePostBody {
    channel: string;
    text?: string;
    username?: string;
    icon_url?: string;
    icon_emoji?: string;
    blocks?: any[];
}