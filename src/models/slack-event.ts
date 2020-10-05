export class SlackEventPayload<T> {
    token: string;
    team_id: string;
    api_app_id: string;
    event: T;
    type: string;
    event_context: string;
    event_id: string;
    event_time: number;

    challenge?: string;
}

export class ReactionAddedEvent {
    type: string;
    user: string;
    item: {
        type: string;
        channel: string;
        ts: string;
    };
    reaction: string;
    item_user: string;
    event_ts: string;
}

