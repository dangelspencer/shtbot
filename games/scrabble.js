const fs = require('fs');
const util = require('util');

const textConverterHelper = require('../helpers/text-converter');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const fileExistsAsync = util.promisify(fs.exists);

class ScrabbleGame {
    constructor(logger, slackService) {
        this.logger = logger;
        this.slackService = slackService;
    }

    async loadGame(channel) {
        const fileName = `./data/scrabble-${channel}.json`;

        if (await fileExistsAsync(fileName)) {
            return JSON.parse(await readFileAsync(fileName));
        }

        return null;
    }

    async saveGame(gameState) {
        try {
            const fileName = `./data/scrabble-${gameState.channel}.json`;
            await writeFileAsync(fileName, JSON.stringify(gameState));
        } catch (err) {
            this.logger.error('Failed to save game state');
            this.logger.error(err);
            this.logger.error(gameState);
        }
    }

    async startGame(channel, user, players) {
        // check for existing game
        if (await this.loadGame(channel) != null) {
            this.logger.warn('Existing game in channel');
            await this.slackService.postEphemeral({
                text: 'A game is already in progress in this channel',
                channel: channel,
                user: user
            });
            return;
        }
        
        // validate player count
        if (players.length < 2 || players.length > 4) {
            this.logger.warn(`Invalid number of players for scrabble: ${players.length}`);
            await this.slackService.postEphemeral({
                text: 'Invalid number of players\nMust @ 2 - 4 users',
                channel: channel,
                user: user
            });
            return;
        }

        this.logger.info(`Creating new scrabble game in channel: ${channel}`);
        
        // load initial game state
        this.logger.debug('loading initial game state');
        const initialState = JSON.parse(await readFileAsync('./data/scrabble.json'));
        this.logger.debug('done');

        // set the channel for the game
        this.logger.debug('setting channel');
        initialState.channel = channel;
        this.logger.debug('done');

        // randomize player order
        this.logger.debug('randomizing player order');
        initialState.players = players.map((a) => ({sort: Math.random(), value: a}))
            .sort((a, b) => a.sort - b.sort)
            .map((a) => {
                return {
                    ...a.value,
                    tiles: [],
                    score: 0
                };
            });
        this.logger.debug('done');

        // generate tile list
        this.logger.debug('generating tile list');
        let tiles = ('E'.repeat(12) + 'A'.repeat(9) + 'I'.repeat(9) + 'O'.repeat(8) + 'N'.repeat(6) + 'R'.repeat(6) + 'T'.repeat(6) + 'L'.repeat(4) + 'S'.repeat(4) + 'U'.repeat(4)
            + 'D'.repeat(4) + 'G'.repeat(3)
            + 'B'.repeat(2) + 'C'.repeat(2) + 'M'.repeat(2) + 'P'.repeat(2)
            + 'F'.repeat(2) + 'H'.repeat(2) + 'V'.repeat(2) + 'W'.repeat(2) + 'Y'.repeat(2)
            + 'KJXQZ'
        ).split('');

        tiles.push('blank');
        tiles.push('blank');
        this.logger.debug('done');

        // randomly shuffle tiles
        this.logger.debug('shuffling tile list');
        initialState.tiles = tiles.map((a) => ({sort: Math.random(), value: a}))
            .sort((a, b) => a.sort - b.sort)
            .map((a) => a.value);
        this.logger.debug('done');


        let gameState = initialState;

        this.logger.debug('distributing initial tiles');
        // distribute initial tiles to players
        for (let i = 0; i < 7; i++) {
            for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
                gameState = await this.drawTile(gameState, playerIndex);
            }
        }
        this.logger.debug('done');

        // save game state
        this.logger.debug('saving game');
        await this.saveGame(gameState);
        this.logger.debug('done');
        this.logger.debug(JSON.stringify(gameState, null, 4));
        this.logger.debug(`Remaining tiles: ${gameState.tiles.length}`);

        // display initial board
        const board = await this.getBoardString(gameState);

        let message = gameState.players.map(p => `<@${p.id}|${p.username}>`).join('\n');
        message += `\n\nA new Scrabble game has been started! <@${gameState.players[0].id}|${gameState.players[0].username}> goes first!`;
        message += `\n\n${board}`;

        await this.slackService.postMessage({
            text: message,
            channel: channel
        });

        // show each player their tiles
        for (const player of gameState.players) {
            await this.displayPlayerRack(gameState, player.id);
        }
    }

    async displayPlayerRack(gameState, playerId) {
        // TODO: handle blank tiles
        const playerIndex = gameState.players.findIndex(p => p.id === playerId);
        const playerTiles = gameState.players[playerIndex].tiles.map(t => t === 'blank' ? ':blank:' : t).join(' ');
        const rack = await textConverterHelper.textToScrabbleTiles(playerTiles);

        await this.slackService.postEphemeral({
            text: rack,
            channel: gameState.channel,
            user: gameState.players[playerIndex].id
        });
    }

    async drawTile(gameState, playerIndex) {
        // clone game state
        const newGameState = JSON.parse(JSON.stringify(gameState));

        // draw random tile
        const index = Math.floor((Math.random() * gameState.tiles.length));
        const tile = gameState.tiles[index];

        // update new game state
        gameState.tiles.splice(index, 1);
        newGameState.tiles = gameState.tiles;
        newGameState.players[playerIndex].tiles.push(tile);

        return newGameState;
    }

    async getBoardString(gameState) {
        const board = gameState.board;
        let boardString = '';
        // for each row on the board
        for (const row of board) {
            for (const col of row) {
                // convert letters to scrabble tiles
                if (col.length === 1) {
                    boardString += await textConverterHelper.textToScrabbleTiles(col);
                } else {
                    boardString += `:${col}:`;
                }
            }

            boardString += '\n';
        }

        return boardString;
    }
}

module.exports = ScrabbleGame;
