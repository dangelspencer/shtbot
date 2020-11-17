export interface GiphySearchResponse {
    data: [GifModel],
    meta: {
        status: number;
        msg: string;
        response_id: string;
    }
}

export interface GifModel {
    type: string;
    id: string;
    url: string;
    slug: string;
    bitly_gif_url: string;
    bitly_url: string;
    embed_url: string;
    images: {
        downsized: {
            url: string;
        }
    };
}