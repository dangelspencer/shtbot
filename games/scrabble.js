const fs = require('fs');
const util = require('util');

const textConverterHelper = require('../helpers/text-converter');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const fileExistsAsync = util.promisify(fs.exists);

class ScrabbleGame {
    constructor(logger, slackService, channel) {
        this.logger = logger;
        this.slackService = slackService;
        this.channel = channel;
    }

    async loadGame() {
        const fileName = `./data/scrabble-${this.channel}.json`;

        if (await fileExistsAsync(fileName)) {
            this.gameState = JSON.parse(await readFileAsync(fileName));
        }
    }

    // TODO: only save things that have been changed?
    async saveGame() {
        try {
            const fileName = `./data/scrabble-${this.channel}.json`;
            await writeFileAsync(fileName, JSON.stringify(this.gameState));
        } catch (err) {
            this.logger.error('Failed to save game state');
            this.logger.error(err);
            this.logger.error(this.gameState);
        }
    }

    async startGame(user, players) {
        // check for existing game
        if (await this.loadGame() != null) {
            this.logger.warn('Existing game in channel');
            await this.slackService.postEphemeral({
                text: 'A game is already in progress in this channel',
                channel: this.channel,
                user: user
            });
            return;
        }
        
        // validate player count
        if (players.length < 2 || players.length > 4) {
            this.logger.warn(`Invalid number of players for scrabble: ${players.length}`);
            await this.slackService.postEphemeral({
                text: 'Invalid number of players\nMust @ 2 - 4 users',
                channel: this.channel,
                user: user
            });
            return;
        }

        this.logger.info(`Creating new scrabble game in channel: ${this.channel}`);
        
        // load initial game state
        this.logger.debug('loading initial game state');
        const initialState = JSON.parse(await readFileAsync('./data/scrabble.json'));
        this.logger.debug('done');

        // set the channel for the game
        this.logger.debug('setting channel');
        initialState.channel = this.channel;
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

        this.gameState = initialState;

        // save game state
        this.logger.debug('saving game');
        await this.saveGame(initialState);
        this.logger.debug('done');

        // display initial board
        // const board = await this.getBoardString(initialState);

        // let message = this.gameState.players.map(p => `<@${p.id}|${p.username}>`).join('\n');
        // message += `\n\nA new Scrabble game has been started! <@${initialState.players[0].id}|${initialState.players[0].username}> goes first!`;
        // message += `\n\n${board}`;

        // await this.slackService.postMessage({
        //     text: message,
        //     channel: this.channel
        // });

        // show each player their tiles
        for (const player of this.gameState.players) {
            await this.displayPlayerRack(player.id);
        }
    }

    async displayPlayerRack(playerId) {
        // TODO: verify player is a part of the game

        if (this.gameState == null) {
            await this.slackService.postEphemeral({
                text: 'There is no active scrabble game in this channel',
                channel: this.channel,
                user: playerId
            });
            return;
        }

        const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
        const playerTiles = this.gameState.players[playerIndex].tiles;

        // ensure player always has 7 tiles
        while (playerTiles.length < 7 && this.gameState.tiles.length > 0) {
            const index = Math.floor((Math.random() * this.gameState.tiles.length));
            const tile = this.gameState.tiles[index];
            playerTiles.push(tile);
            this.gameState.tiles.splice(index, 1);
        }

        this.gameState.players[playerIndex].tiles = playerTiles;

        await this.saveGame();

        const rack = await textConverterHelper.textToScrabbleTiles(playerTiles.map(t => t === 'blank' ? ':blank:' : t).join(' '));

        await this.slackService.postEphemeral({
            text: rack,
            channel: this.channel,
            user: this.gameState.players[playerIndex].id
        });
    }

    async reorderPlayerTiles(playerId, newOrder) {
        // load game
        await this.loadGame();

        // verify there is an active game
        if (this.gameState == null) {
            this.logger.warn(`user '${playerId}' attempted to reorder tile rack without an active game in the channel`);
            await this.slackService.postEphemeral({
                text: 'There is no active scrabble game in this channel',
                channel: this.channel,
                user: playerId
            });
            return;
        }

        // verify player is a part of the game
        const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            await this.slackService.postEphemeral({
                text: 'You don\'t seem to be a part of this game',
                channel: this.channel,
                user: playerId
            });
            return;
        }

        // validate number of tiles in new order
        const playerTiles = this.gameState.players[playerIndex].tiles;
        if (newOrder.split(' ').length !== playerTiles.length) {
            await this.slackService.postEphemeral({
                text: 'Tiles must be separated by spaces',
                channel: this.channel,
                user: playerId
            });
            return;
        }

        const newTiles = newOrder
            .toUpperCase()
            // handle double character tiles
            .split('AA').join('A')
            .split('BB').join('B')
            .split('MM').join('M')
            .split('OO').join('O')
            .split('VV').join('V')
            .split('XX').join('X')

            // remove spaces and ':'s
            .split(' ').join('')
            .split(':').join('')
            
            // convert to array
            .split('');


        // validate number of tiles
        if (newTiles.length !== playerTiles.length) {
            this.logger.warn(`user '${playerId}' attempted to reorder tile rack with wrong number of tiles`);
            await this.slackService.postEphemeral({
                text: 'Number of tiles reordered does not match current number of tiles in rack',
                channel: this.channel,
                user: playerId
            });
            return;
        }

        // validate each tile exists in rack
        for (const tile of newTiles) {
            const tileIndex = playerTiles.findIndex(t => t === tile);
            if (tileIndex === -1) {
                this.logger.warn(`user '${playerId}' attempted to reorder tile rack with the wrong tile`);
                await this.slackService.postEphemeral({
                    text: `:${tile.toLowerCase()}: is not in your tile rack`,
                    channel: this.channel,
                    user: playerId
                });
                return;
            }

            playerTiles.splice(tileIndex, 1);
        }

        // save new tile order for player
        this.gameState.players[playerIndex].tiles = newTiles;
        await this.saveGame();

        // display the new order of tiles to the player
        await this.displayPlayerRack(playerId);
    }

    async exchangeTiles(playerId, tiles) {
        // load game
        await this.loadGame();

        // verify player is a part of the game
        const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            await this.slackService.postEphemeral({
                text: 'You don\'t seem to be a part of this game',
                channel: this.channel,
                user: playerId
            });
            return;
        }

        // TODO: verify that it's the current player's turn

        const playerTiles = this.gameState.players[playerIndex].tiles;

        // make sure the user can't exchange more tiles than they have
        if (tiles.split(' ').length > playerTiles.length) {
            await this.slackService.postEphemeral({
                text: 'Unable to exchange: invalid number of tiles',
                channel: this.channel,
                user: playerId
            });
            return;
        }

        const exchangedTiles = tiles
            .toUpperCase()
            // handle double character tiles
            .split('AA').join('A')
            .split('BB').join('B')
            .split('MM').join('M')
            .split('OO').join('O')
            .split('VV').join('V')
            .split('XX').join('X')

            // remove spaces and ':'s
            .split(' ').join('')
            .split(':').join('')
            
            // convert to array
            .split('');


        // validate each tile exists in rack
        for (const tile of exchangedTiles) {
            const tileIndex = playerTiles.findIndex(t => t === tile);
            if (tileIndex === -1) {
                this.logger.warn(`user '${playerId}' attempted to exchange tile that doesn't exist in their rack`);
                await this.slackService.postEphemeral({
                    text: `:${tile.toLowerCase()}: is not in your tile rack`,
                    channel: this.channel,
                    user: playerId
                });
                return;
            }

            playerTiles.splice(tileIndex, 1);
        }

        // save user rack without the exchanged tiles
        await this.saveGame();

        // display the new rack to the user (draws back up to 7 tiles)
        await this.displayPlayerRack(playerId);

        // put the exchanged tiles back in the tile list
        // have to load the game state again to get the changes made in the displayPlayerRack() function
        const newGameState = await this.loadGame();
        for (const tile of exchangedTiles) {
            newGameState.tiles.push(tile);
        }
        await this.saveGame(newGameState);

        // TODO: increment currentPlayer count
    }

    async getBoardString() {
        const board = this.gameState.board;
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

/*
 * TODO
 * command to play a word
*/
