import { SlackMessagePostBody } from "./slack-message";

export class GenericSlackResponse {
    ok: boolean;
    error?: string;

    user?: SlackUserModel;
    message?: SlackMessageModel;
}

export class SlackUserModel {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    color: string;
    real_name: string;
    tz: string;
    tz_label: string;
    tz_offset: number;
    profile: {
        avatar_hash: string;
        status_text: string;
        status_emoji: string;
        real_name: string;
        display_name: string;
        real_name_normalized: string;
        display_name_normalized: string;
        email: string;
        image_original: string;
        image_24: string;
        image_32: string;
        image_48: string;
        image_72: string;
        image_192: string;
        image_512: string;
        team: string;
    };
    is_admin: boolean;
    is_owner: boolean;
    is_primary_owner: boolean;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
    is_bot: boolean;
    updated: number;
    is_app_user: boolean;
    has_2fa: boolean;
}

export class SlackReactionModel {
    count: number;
    name: string;
    users: [string];
}

export class SlackMessageModel {
    type: string;
    user: string;
    text: string;
    ts: string;
    reactions: [SlackReactionModel];
    attachments: [any]; // TODO: define this object
}