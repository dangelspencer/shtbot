import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GiphySearchResponse, GifModel } from 'src/models/giphy';
import { config } from '../config';


@Injectable()
export class GiphyService {
    private readonly logger = new Logger(GiphyService.name);

    async getGifForSearchText(searchText: string, limit = 20): Promise<GifModel> {
        this.logger.verbose(`searching giphy for gifs related to ${searchText}`);
        const response = await axios.get<GiphySearchResponse>(`http://api.giphy.com/v1/gifs/search?q=${searchText}&api_key=${config.giphy.apiKey}&limit=${limit}`);

        if (response.data.meta.status != 200) {
            this.logger.error(`failed to fetch gifs from giphy api: ${response.data.meta.msg}`);
            throw new Error(`failed to fetch gifs from giphy api: ${response.data.meta.msg}`);
        }

        const index = Math.floor((Math.random() * response.data.data.length));
        return response.data.data[index];
    }
}