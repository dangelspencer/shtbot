import { Injectable, Logger } from '@nestjs/common';
import { GameState, ScrabblePlayer, BoardSpace, WordDirection, Tile, BoardTile, ScrabbleTurnType, ScrabblePlayWordTurn, ScrabbleExchangeTurn, ScrabbleChallengeTurn } from 'src/models/scrabble';
import { SlackService } from 'src/services/slack.service';
import { config } from '../config';
import * as fs from 'fs';
import { SlackMessagePostBody, SlackEphemeralMessagePostBody } from 'src/models/slack-message';
import { TextHelper } from 'src/helpers/text.helper';

@Injectable()
export class ScrabbleGame {
    private readonly logger = new Logger(ScrabbleGame.name);
    private gameState: GameState;
    private dictionaryWords: string[] = null;

    constructor(
        private readonly slackService: SlackService,
        private readonly textHelper: TextHelper) {}

    private loadGame(channel: string): boolean {
        this.logger.verbose('loading game state');

        const gameDataFolder = config.games.dataDirectory;
        if (!fs.existsSync(gameDataFolder)) {
            fs.mkdirSync(gameDataFolder, { recursive: true });
        }

        const fileName = `${gameDataFolder}/scrabble-${channel}.json`;
        if (fs.existsSync(fileName)) {
            const data = fs.readFileSync(fileName, 'utf8');
            this.gameState = JSON.parse(data);
            return true;
        }

        return false;
    }

    private saveGame() {
        this.logger.verbose('saving game state');

        const gameDataFolder = config.games.dataDirectory;
        if (!fs.existsSync(gameDataFolder)) {
            fs.mkdirSync(gameDataFolder, { recursive: true });
        }

        const fileName = `${gameDataFolder}/scrabble-${this.gameState.channel}.json`;
        const data = JSON.stringify(this.gameState, null, 4);
        fs.writeFileSync(fileName, data);
    }

    private deleteGameData() {
        this.logger.verbose('deleting game data');

        const gameDataFolder = config.games.dataDirectory;
        if (!fs.existsSync(gameDataFolder)) {
            fs.mkdirSync(gameDataFolder, { recursive: true });
        }

        const oldFileName = `${gameDataFolder}/scrabble-${this.gameState.channel}.json`;
        const newFileName = `${gameDataFolder}/scrabble-${this.gameState.channel}-${new Date().getTime()}.json`;
        fs.renameSync(oldFileName, newFileName);
    }

    private initalizeGameState(channel: string) {
        this.logger.verbose(`initializing new game in channel: ${channel}`);
        this.gameState = {
            board: this.initializeBoard(),
            tilePouch: this.initializeTilePouch(),
            turns: [],
            players: {
                '1': null,
                '2': null,
                '3': null,
                '4': null
            },
            currentPlayer: 1,
            channel,
            statusMessageTS: null
        };
        this.logger.debug(JSON.stringify(this.gameState));
    }

    private initializePlayer(userId, playerIndex) {
        this.logger.verbose(`initializing player ${playerIndex}: ${userId}`);
        const player: ScrabblePlayer = {
            points: 0,
            userId,
            tileRack: [],
            losesNextTurn: false,
            passedLastTurn: false
        };

        this.gameState.players[playerIndex.toString()] = player;
        this.drawTilesForPlayer(playerIndex);
        this.logger.debug(JSON.stringify(this.gameState.players[playerIndex.toString()]));
    }

    // tile distributions taken from http://scrabblewizard.com/scrabble-tile-distribution/
    private initializeTilePouch(): string[] {
        const tiles = ('E'.repeat(12) + 'A'.repeat(9) + 'I'.repeat(9) + 'O'.repeat(8) + 'N'.repeat(6) + 'R'.repeat(6) + 'T'.repeat(6) + 'L'.repeat(4) + 'S'.repeat(4) + 'U'.repeat(4)
            + 'D'.repeat(4) + 'G'.repeat(3)
            + 'B'.repeat(2) + 'C'.repeat(2) + 'M'.repeat(2) + 'P'.repeat(2)
            + 'F'.repeat(2) + 'H'.repeat(2) + 'V'.repeat(2) + 'W'.repeat(2) + 'Y'.repeat(2) 
            + '_'.repeat(2)
            + 'KJXQZ' 
        ).toLowerCase().split('');
        
        return tiles;
    }   

    // point values taken from http://scrabblewizard.com/scrabble-tile-distribution/
    private getPointsForLetter(letter: string): number {
        switch (letter) {
            case 'e':
            case 'a':                
            case 'i':
            case 'o':
            case 'n':
            case 'r':
            case 't':
            case 'l':
            case 's':
            case 'u':
                return 1;
            case 'd':
            case 'g':
                return 2;
            case 'b':
            case 'c':
            case 'm':
            case 'p':
                return 3;
            case 'f':
            case 'h':
            case 'v':
            case 'w':
            case 'y':
                return 4;
            case 'k':
                return 5;
            case 'j':
            case 'x':
                return 8;
            case 'q':
            case 'z':
                return 10;
            default:
                return 0;
        }
    }

    private shuffleTilePouch() {
        this.gameState.tilePouch = this.gameState.tilePouch.map((a) => ({sort: Math.random(), value: a}))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value);
    }

    private drawTilesForPlayer(playerIndex: number): string[] {
        this.logger.verbose(`drawing tiles for player ${playerIndex}`);
        this.shuffleTilePouch();

        const playerTiles = this.gameState.players[playerIndex.toString()].tileRack;

        const newTiles = [];
        while (playerTiles.length < 7 && this.gameState.tilePouch.length > 0) {
            const index = Math.floor(Math.random() * this.gameState.tilePouch.length);
            playerTiles.push(this.gameState.tilePouch[index]);
            newTiles.push(this.gameState.tilePouch[index]);
            this.gameState.tilePouch.splice(index, 1);
        }

        this.gameState.players[playerIndex.toString()].tileRack = playerTiles;
        return newTiles;
    }

    private initializeBoard(): Tile[][] {
        this.logger.verbose('initializing game board');
        const board = [];
        for (let i = 0; i < 15; i++) {
            const arr = [];
            for (let j = 0; j < 15; j++) {
                arr.push(null);
            }

            board.push(arr);
        }

        return board;
    }

    private getBoardSpaceForPosition(x: number, y: number): BoardSpace {
        const formattedPostition = `${x},${y}`;

        switch (formattedPostition) {
            case '0,0':
            case '7,0':
            case '14,0':
            case '0,7':
            case '14,7':
            case '0,14':
            case '7,14':
            case '14,14':
                return BoardSpace.TripleWord;
            case '1,1':
            case '13,1':
            case '2,2':
            case '12,2':
            case '3,3':
            case '11,3':
            case '4,4':
            case '10,4':
            case '4,10':
            case '10,10':
            case '3,11':
            case '11,11':
            case '2,12':
            case '12,12':
            case '1,13':
            case '13,13':
                return BoardSpace.DoubleWord;
            case '5,1':
            case '9,1':
            case '1,5':
            case '5,5':
            case '9,5':
            case '13,5':
            case '1,9':
            case '5,9':
            case '9,9':
            case '13,9':
            case '5,13':
            case '9,13':
                return BoardSpace.TripleLetter;
            case '3,0':
            case '11,0':
            case '6,2':
            case '8,2':
            case '0,3':
            case '7,3':
            case '14,3':
            case '2,6':
            case '6,6':
            case '8,6':
            case '12,6':
            case '3,7':
            case '11,7':
            case '2,8':
            case '6,8':
            case '8,8':
            case '12,8':
            case '0,11':
            case '7,11':
            case '14,11':
            case '6,12':
            case '8,12':
            case '3,14':
            case '11,14':
                return BoardSpace.DoubleLetter;
            case '7,7':
                return BoardSpace.Center;
            default:
                return BoardSpace.Blank;
        }
    }

    private getBoardDisplayString(): string {
        let boardString = '';
        for (let y = 0; y < 15; y++) {
            let row = '';
            for (let x = 0; x < 15; x++) {
                if (this.gameState.board[x][y] == null) {
                    const boardSpace = this.getBoardSpaceForPosition(x, y);
                    switch (boardSpace) {
                        case BoardSpace.Center:
                            row += ':sb_center:';
                            break;
                        case BoardSpace.DoubleLetter:
                            row += ':sb_dl:';
                            break;
                        case BoardSpace.DoubleWord:
                            row += ':sb_dw:';
                            break;
                        case BoardSpace.Blank:
                            row += ':sb_empty:';
                            break;
                        case BoardSpace.TripleLetter:
                            row += ':sb_tl:';
                            break;
                        case BoardSpace.TripleWord:
                            row += ':sb_tw:';
                            break;
                    }
                } else {
                    if (this.gameState.board[x][y].letter === '_') {
                        row += ':blank:';
                    } else {
                        row += this.textHelper.textToScrabbleTiles(this.gameState.board[x][y].letter);
                    }
                }
            }

            row += '\n';
            boardString += row;
        }

        return boardString;
    }

    private incrementTurn() {
        this.logger.verbose('incrementing turn');
        let nextPlayer = this.gameState.currentPlayer;

        do {
            if (this.gameState.players[nextPlayer.toString()] != null) {
                if (this.gameState.players[nextPlayer.toString()].losesNextTurn) {
                    this.logger.debug(`Skipping player ${nextPlayer} since they lost their turn`);
                }
                this.gameState.players[nextPlayer.toString()].losesNextTurn = false;
            }

            if (nextPlayer === 4) {
                nextPlayer = 1;
            } else {
                nextPlayer += 1;
            }
        } while (this.gameState.players[nextPlayer.toString()] == null || this.gameState.players[nextPlayer.toString()].losesNextTurn);

        this.gameState.currentPlayer = nextPlayer;
    }

    private displayTileRackForPlayer(playerIndex: number) {
        this.logger.verbose(`displaying tile rack for player ${playerIndex}`);
        const formattedTileRack = this.gameState.players[playerIndex.toString()].tileRack
            .map(x => x === '_' ? ':blank:' : this.textHelper.textToScrabbleTiles(x)).join('');

        const messageData: SlackEphemeralMessagePostBody = {
            user:  this.gameState.players[playerIndex.toString()].userId,
            channel: this.gameState.channel,
            text: formattedTileRack
        };

        this.slackService.postEphemeralMessage(messageData);
    }

    private findIndexOfPlayerWithId(userId): number {
        this.logger.verbose(`determining playerIndex for user: ${userId}`);
        let playerIndex = this.gameState.currentPlayer;
        while (this.gameState.players[playerIndex.toString()] == null || this.gameState.players[playerIndex.toString()].userId !== userId) {
            if (playerIndex === 4) {
                playerIndex = 1;
            } else {
                playerIndex += 1;
            }

            if (playerIndex === this.gameState.currentPlayer) {
                this.logger.warn(`user: ${userId} is not in the game`);
                this.sendErrorMessage(userId, 'Error: you are not a part of this game');
                return null;
            }
        }

        return playerIndex;
    }

    displayTileRack(channelId: string, userId: string) {
        if (!this.loadGame(channelId)) {
            this.sendErrorMessage(userId, 'There is no active game in this channel', channelId);
            return;
        }

        // find index of player with userId
        const playerIndex = this.findIndexOfPlayerWithId(userId);
        if (playerIndex == null) {
            this.sendErrorMessage(userId, 'You are not part of this game');
            return;
        }

        this.displayTileRackForPlayer(playerIndex);
    }

    newGame(channel: string, userId: string, userIds: string[]) {
        this.logger.log(`user ${userId} created a new scrabble game in channel ${channel} with players: ${JSON.stringify(userIds)}`);
        if (this.loadGame(channel)) {
            this.sendErrorMessage(userId, 'There is already an active game in this channel', channel);
            return;
        } else {
            // create inital game state
            this.initalizeGameState(channel);
            this.logger.verbose('game initialized');

            // validate number of players
            if (userIds.length > 4 || userIds.length < 2) {
                this.sendErrorMessage(userId, 'Error: there must be 2 to 4 players');
                return;
            }

            // shuffle player order
            const shuffledUserIds = userIds.map((a) => ({sort: Math.random(), value: a}))
                .sort((a, b) => a.sort - b.sort)
                .map((a) => a.value);

            // initialize players
            let playerIndex = 1;
            for (const userId of shuffledUserIds) {
                this.initializePlayer(userId, playerIndex);
                playerIndex += 1;
            }
            this.logger.verbose('players initialized');

            // save initial game state
            this.saveGame();

            // send new game message
            this.updateStatus('A new scrabble game has been started!');
        }
    }

    reorderTiles(channelId: string, userId: string, newOrder: string) {
        this.logger.verbose(`reordering tile rack for user: ${userId}`);
        if (!this.loadGame(channelId)) {
            this.sendErrorMessage(userId, 'There is no active game in this channel', channelId);
            return;
        }

        // find index of player with userId
        const playerIndex = this.findIndexOfPlayerWithId(userId);
        if (playerIndex == null) {
            this.sendErrorMessage(userId, 'You are not part of this game');
            return;
        }

        const formattedOrder = this.textHelper.scrabbleTilesToText(newOrder).replace('blank', '_');

        if (formattedOrder.length < 0 || formattedOrder.length > 7) {
            this.sendErrorMessage(userId, 'Unable to reorder tile rack, invalid number of tiles provided');
            return;
        }

        const newTiles = [];
        for (let i = 0; i < formattedOrder.length; i++) {
            const tile = formattedOrder.charAt(i);

            const index = this.gameState.players[playerIndex.toString()].tileRack.indexOf(tile);
            if (index === -1) {
                this.sendErrorMessage(userId, `Unable to reorder tiles, ${this.textHelper.textToScrabbleTiles(tile)} is not in your tile rack`);
                return;
            }

            newTiles.push(tile);
            this.gameState.players[playerIndex.toString()].tileRack.splice(index, 1);
        }

        if (this.gameState.players[playerIndex.toString()].tileRack.length > 0) {
            this.gameState.players[playerIndex.toString()].tileRack = newTiles.concat(this.gameState.players[playerIndex.toString()].tileRack);
        } else {
            this.gameState.players[playerIndex.toString()].tileRack = newTiles;
        }
        
        this.saveGame();
        this.displayTileRackForPlayer(playerIndex);
    }

    exchangeTiles(channelId: string, userId: string, tilesToExchange: string) {
        this.logger.verbose(`exchanging tiles for user: ${userId}`);
        if (!this.loadGame(channelId)) {
            this.sendErrorMessage(userId, 'There is no active game in this channel', channelId);
            return;
        }

        // find index of player with userId
        const playerIndex = this.findIndexOfPlayerWithId(userId);
        if (playerIndex == null) {
            this.sendErrorMessage(userId, 'You are not part of this game');
            return;
        }

        // verify it's the player's turn
        if (playerIndex !== this.gameState.currentPlayer) {
            this.logger.warn(`user ${userId} is not the current player`);
            this.sendErrorMessage(userId, 'wait for your turn');
            return;
        }

        const formattedOrder = this.textHelper.scrabbleTilesToText(tilesToExchange).replace('blank', '_');

        if (formattedOrder.length < 0 || formattedOrder.length > 7) {
            this.sendErrorMessage(userId, 'Unable to exchange tiles, invalid number of tiles provided');
            return;
        }

        // ensure there are enough tiles in the pouch
        if (formattedOrder.length > this.gameState.tilePouch.length) {
            this.sendErrorMessage(userId, `Unable to exchange tiles, cannot exchange ${formattedOrder.length} tiles when there are only ${this.gameState.tilePouch.length} in the tile pouch`);
            return;
        }

        if (formattedOrder.length === 0 && this.gameState.tilePouch.length === 0) {
            this.gameState.players[playerIndex.toString()].passedLastTurn = true;

            // check if all other players have passed
            let allPlayersHavePassed = true;
            for (let i = 1; i <= 4; i++) {
                if (this.gameState.players[i.toString()] != null && !this.gameState.players[i.toString()].passedLastTurn) {
                    allPlayersHavePassed = false;
                }
            }

            if (allPlayersHavePassed) {
                this.gameOver('All players have passed, there are no moves left!');
                return;
            }
        }

        // validate tiles being exchanged are in the users tile rack
        const exchangedTiles = [];
        for (let i = 0; i < formattedOrder.length; i++) {
            const tile = formattedOrder.charAt(i);

            const index = this.gameState.players[playerIndex.toString()].tileRack.indexOf(tile);
            if (index === -1) {
                this.sendErrorMessage(userId, `Unable to exchange tiles, ${this.textHelper.textToScrabbleTiles(tile)} is not in your tile rack`); 
                return;
            }

            exchangedTiles.push(tile);
            this.gameState.players[playerIndex.toString()].tileRack.splice(index, 1);
        }

        const drawnTiles = this.drawTilesForPlayer(playerIndex);

        const statusMessage = `<@${userId}> exchanged some tiles`;

        const turn: ScrabbleExchangeTurn = {
            type: ScrabbleTurnType.Exchange,
            player: playerIndex,
            userId,
            exchangedTiles,
            drawnTiles,
            statusMessage
        };

        this.gameState.turns.push(turn);
        this.gameState.tilePouch = this.gameState.tilePouch.concat(exchangedTiles);

        this.displayTileRackForPlayer(playerIndex);
        this.incrementTurn();
        this.saveGame();

        // send status message
        this.updateStatus(statusMessage);
    }

    playWord(channelId: string, userId: string, details: string) {
        this.logger.verbose(`playing word for user: ${userId}`);
        if (!this.loadGame(channelId)) {
            this.sendErrorMessage(userId, 'There is no active game in this channel', channelId);
            return;
        }

        // find index of player with userId
        const playerIndex = this.findIndexOfPlayerWithId(userId);
        if (playerIndex == null) {
            this.sendErrorMessage(userId, 'You are not part of this game');
            return;
        }

        // verify it's the player's turn
        if (playerIndex !== this.gameState.currentPlayer) {
            this.logger.warn(`user ${userId} is not the current player`);
            this.sendErrorMessage(userId, 'wait for your turn');
            return;
        }

        // parse placement details from string
        const formattedDetails = this.textHelper.scrabbleTilesToText(details).replace('blank', '_');;
        const detailParts = formattedDetails.split(' ');
        if (detailParts.length < 3 || (detailParts.length === 4 && !detailParts[2].includes('_') || detailParts.length > 4)) {
            this.sendErrorMessage(userId, 'Invalid command format - usage: /scrabble play (<startx>,<starty>) (<endx>,<endy>) <word> <replacements>');
            return;
        }

        const [startX, startY] = detailParts[0].replace('(', '').replace(')', '').split(',');
        const [endX, endY] = detailParts[1].replace('(', '').replace(')', '').split(',');
        const word = detailParts[2];

        let replacements = [];
        if (detailParts.length === 4) {
            replacements = detailParts[3].split('');

            // validate number of replacements match number of blank tiles
            const numBlankTiles = (word.match(/_/g) || []).length;
            if (numBlankTiles != replacements.length) {
                this.sendErrorMessage(userId, 'Number of replacements does not match number of blank tiles - usage: /scrabble play (<startx>,<starty>) (<endx>,<endy>) <word> <replacements>');
                return;
            }
        }

        // validate start and end positions are numbers
        if (parseInt(startX) === NaN || parseInt(startX) < 0 || parseInt(startX) > 14) {
            this.sendErrorMessage(userId, 'Unable to play word - startX must be a number between 0 and 14');
            return;
        }
        if (parseInt(startY) === NaN || parseInt(startY) < 0 || parseInt(startY) > 14) {
            this.sendErrorMessage(userId, 'Unable to play word - startY must be a number between 0 and 14');
            return;
        }
        if (parseInt(endX) === NaN || parseInt(endX) < 0 || parseInt(endX) > 14) {
            this.sendErrorMessage(userId, 'Unable to play word -endX must be a number between 0 and 14');
            return;
        }
        if (parseInt(endY) === NaN || parseInt(endY) < 0 || parseInt(endY) > 14) {
            this.sendErrorMessage(userId, 'Unable to play word - endY must be a number between 0 and 14');
            return;
        }

        // validate word is 2 characters or longer
        if (word.length < 2) {
            this.sendErrorMessage(userId, 'Unable to play word - word must contain at least two letters');
            return;
        }

        // determine direction of word
        let wordDirection = null;
        if (startY !== endY && startX === endX && parseInt(startY) < parseInt(endY)) {
            wordDirection = WordDirection.Vertical;
        } else if (startX !== endX && startY === endY && parseInt(startX) < parseInt(endX)) {
            wordDirection = WordDirection.Horizontal;
        }

        // validate word direction
        if (wordDirection == null) {
            this.sendErrorMessage(userId, 'Unable to play word - word direction must be either left-to-right or top-to-bottom');
            return;
        }

        // build tile list
        const playerTileRack = JSON.parse(JSON.stringify(this.gameState.players[this.gameState.currentPlayer.toString()].tileRack));
        const tiles: Tile[] = [];
        let x = parseInt(startX);
        let y = parseInt(startY);
        for (let i = 0; i < word.length; i++) {
            const indexInTileRack = playerTileRack.indexOf(word.charAt(i));
            const isOnBoard = this.gameState.board[x][y] !== null;

            // create tile object
            const tile: Tile = {
                x: x,
                y: y,
                letter: word.charAt(i),
                inRack: indexInTileRack !== -1,
                isOnBoard,
                replacement: word.charAt(i) === '_' ? replacements[0] : null
            };

            if (isOnBoard && this.gameState.board[x][y].letter === '_') {
                tile.replacement = tile.letter;
                tile.letter = '_';
            }

            // add to tile list
            tiles.push(tile);

            // remove replacement from list
            if (tile.replacement != null) {
                replacements.splice(0, 1);
            }

            // move to the next board space
            if (i !== word.length - 1) {
                if (wordDirection === WordDirection.Horizontal) {
                    x += 1;
                } else {
                    y += 1;
                }
            }

            // remove played tile from player's tile rack
            if (indexInTileRack !== -1) {
                playerTileRack.splice(indexInTileRack, 1);
            }
        }

        // validate end postion
        if (x.toString() !== endX || y.toString() !== endY) {
            this.sendErrorMessage(userId, `Unable to play word - calculated end position does not match expected\nexpected: (${endX},${endY})\ncalculated: (${x},${y})`);
            return;
        }

        // validate word intersects with another word
        let doesIntersectWithWord = false;
        for (const tile of tiles) {
            if (tile.isOnBoard && this.gameState.board[tile.x][tile.y].letter === tile.letter && this.gameState.board[tile.x][tile.y].replacement === tile.replacement) {
                doesIntersectWithWord = true;
            } else if (tile.isOnBoard && this.gameState.board[tile.x][tile.y] != null && (this.gameState.board[tile.x][tile.y].letter !== tile.letter || this.gameState.board[tile.x][tile.y].replacement !== tile.replacement)) {
                this.sendErrorMessage(userId, `Unable to play word - expected (${tile.x},${tile.y}) to contain ${tile.letter === '_' ? ':blank:' : this.textHelper.textToScrabbleTiles(tile.letter)} but the board space already has ${this.textHelper.textToScrabbleTiles(this.gameState.board[tile.x][tile.y].letter === '_' ? this.gameState.board[tile.x][tile.y].replacement : this.gameState.board[tile.x][tile.y].letter)}!`);
                return;
            } else if (!tile.inRack) {
                if (this.gameState.board[tile.x][tile.y] == null) {
                    this.sendErrorMessage(userId, `Unable to play word - expected (${tile.x},${tile.y}) to contain ${tile.letter === '_' ? ':blank:' : this.textHelper.textToScrabbleTiles(tile.letter)} but the board space is empty!`);
                    return;
                } else if (this.gameState.board[tile.x][tile.y].letter === tile.letter) {
                    doesIntersectWithWord = true;
                }
            }
        }
        
        // use tile list to update board state
        const secondaryWords = [];
        let secondaryPoints = 0;
        let points = 0;
        let numberOfDoubleWordTiles = 0;
        let numberOfTripleWordTiles = 0;
        let doesIncludeCenterSpace = false;
        for (const tile of tiles) {
            if (tile.inRack) {
                const newTile: BoardTile = {
                    letter: tile.letter,
                    replacement: tile.replacement
                }
                this.gameState.board[tile.x][tile.y] = newTile;

                let pointsMultiplier = 1;
                if (!tile.isOnBoard) {
                    // remove tile from rack
                    const index = this.gameState.players[this.gameState.currentPlayer.toString()].tileRack.indexOf(tile.letter);
                    this.gameState.players[this.gameState.currentPlayer.toString()].tileRack.splice(index, 1);

                    // check for special board space
                    const boardSpace = this.getBoardSpaceForPosition(tile.x, tile.y);
                    switch (boardSpace) {
                        case BoardSpace.DoubleLetter:
                            pointsMultiplier = 2;
                            break;
                        case BoardSpace.Center:
                            doesIncludeCenterSpace = true;
                        case BoardSpace.DoubleWord:
                            numberOfDoubleWordTiles += 1;
                            break;
                        case BoardSpace.TripleLetter:
                            pointsMultiplier = 3;
                            break;
                        case BoardSpace.TripleWord:
                            numberOfTripleWordTiles += 1;
                            break;
                        case BoardSpace.Blank:
                        default:
                            break;
                    }
                    
                    // check for secondary words built from new tile
                    const secondaryWord = this.checkForSecondaryWord(tile.x, tile.y, wordDirection);
                    if (secondaryWord != null) {
                        secondaryWords.push(secondaryWord.split('_').join(''));
                        let secondaryWordPoints = 0;

                        // remove blank tile replacements from word (because blank tiles are worth 0 points)
                        const originalWord = secondaryWord.split('_').map((x, i) => {
                            if (i > 0 && x.length > 0) {
                                return x.split('').splice(0, 1).join('');
                            }

                            return x;
                        }).join('');

                        for (let i = 0; i < originalWord.length; i++) {
                            secondaryWordPoints += this.getPointsForLetter(originalWord.charAt(i));

                            if (boardSpace === BoardSpace.TripleLetter) {
                                secondaryWordPoints += this.getPointsForLetter(tile.letter) * 2;
                            } else if (boardSpace === BoardSpace.DoubleLetter) {
                                secondaryWordPoints += this.getPointsForLetter(tile.letter);
                            }
                        }

                        if (boardSpace === BoardSpace.TripleWord) {
                            secondaryWordPoints = secondaryWordPoints * 3;
                        } else if (boardSpace === BoardSpace.DoubleWord) {
                            secondaryWordPoints = secondaryWordPoints * 2;
                        }

                        secondaryPoints += secondaryWordPoints;
                    }
                }

                points += this.getPointsForLetter(tile.letter) * pointsMultiplier;
            } else {
                points += this.getPointsForLetter(tile.letter);
            }
        }

        // verify word intersects or builds onto another word
        if (!doesIntersectWithWord && this.gameState.turns.length > 0 && secondaryWords.length === 0) {
            this.sendErrorMessage(userId, 'Unable to play word - new word must intersect with an existing word');
            return;
        }

        // validate that the first word is played on the center of the board
        if (this.gameState.turns.length === 0 && !doesIncludeCenterSpace) {
            this.sendErrorMessage(userId, 'Unable to play word - the first word must be played in the center of the board');
            return;
        }

        // apply double / triple word point adjustments
        for (let i = 0; i < numberOfDoubleWordTiles; i++) {
            points = points * 2;
        }
        for (let i = 0; i < numberOfTripleWordTiles; i++) {
            points = points * 3;
        }

        // add points for secondary words
        points += secondaryPoints;

        // add BINGO score (all 7 tiles played)
        if (tiles.filter(x => x.isOnBoard === false).length === 7) {
            this.logger.debug('Adding BINGO score to turn point value');
            points += 50;
        }

        // update player points
        this.gameState.players[this.gameState.currentPlayer.toString()].points += points;

        // refill tile rack for player
        const drawnTiles = this.drawTilesForPlayer(this.gameState.currentPlayer);

        // build status message
        let displayWord = this.textHelper.textToScrabbleTiles(word.split('').map(x => x === '_' ? ':blank:' : this.textHelper.textToScrabbleTiles(x)).join(''));
        if (word.includes('_')) {
            displayWord += ` (${this.textHelper.textToScrabbleTiles(tiles.map(x => x.letter === '_' ? x.replacement : x.letter).join(''))})`;
        }

        const statusMessage = `<@${userId}> played ${displayWord} for ${points} points`;

        // build turn object
        const turnData: ScrabblePlayWordTurn = {
            type: ScrabbleTurnType.Word,
            words: [word.split('').map((x, i) => x === '_' ? tiles[i].replacement : x).join('')].concat(secondaryWords),
            points,
            userId,
            player: playerIndex,
            playedTiles: tiles.filter(x => x.isOnBoard === false),
            drawnTiles,
            statusMessage
        };
        this.gameState.turns.push(turnData);
        this.gameState.players[this.gameState.currentPlayer.toString()].passedLastTurn = false;

        this.incrementTurn();
        this.saveGame();

        // check if game is over
        if (this.gameState.players[playerIndex].tileRack.length === 0 && this.gameState.tilePouch.length === 0) {
            this.gameOver();
        } else {
            // update status    
            this.updateStatus(statusMessage);
        }
    }

    private gameOver(message: string = null) {
        // find player with the most points
        const playersByScore = this.getPlayersByScore();
        const winningPlayer = playersByScore[0];

        // create game over message
        let gameOverMessage = message;
        if (message == null) {
            gameOverMessage = `${this.textHelper.textToScrabbleTiles('game over')}`;
        }

        gameOverMessage += `\n<@${winningPlayer.userId}> wins with ${winningPlayer.points} points!`;

        // get status message from last turn
        const lastStatusMessage = this.gameState.turns[this.gameState.turns.length -1].statusMessage;
        this.updateStatus(`${lastStatusMessage}\n\n\n${gameOverMessage}`);

        // delete game data
        this.deleteGameData();
    }

    private getPlayersByScore(): ScrabblePlayer[] {
        const players = [];
        for (let i = 1; i <= 4; i++) {
            if (this.gameState.players[i.toString()] != null) {
                players.push(this.gameState.players[i.toString()]);
            }
        }

        return players.sort((a, b) => b.points - a.points);
    }

    private undoPlayWordTurn() {
        // get turn details
        const turn = this.gameState.turns[this.gameState.turns.length - 1] as ScrabblePlayWordTurn;

        // remove new tiles from player's tile rack and add them back to tile pouch
        for (const tile of turn.drawnTiles) {
            const indexInTileRack = this.gameState.players[turn.player.toString()].tileRack.indexOf(tile);
            this.gameState.players[turn.player.toString()].tileRack.splice(indexInTileRack, 1);
        }
        this.gameState.tilePouch = this.gameState.tilePouch.concat(turn.drawnTiles);
        
        // remove played tiles from game board and add them back to the player's tile rack
        for (const tile of turn.playedTiles) {
            this.gameState.board[tile.x][tile.y] = null;
        }
        this.gameState.players[turn.player.toString()].tileRack = this.gameState.players[turn.player.toString()].tileRack.concat(turn.playedTiles.map(x => x.letter));

        // deduct points gained on the turn
        this.gameState.players[turn.player.toString()].points -= turn.points;
    }

    private undoExchangeTilesTurn() {
        // get turn details
        const turn = this.gameState.turns[this.gameState.turns.length - 1] as ScrabbleExchangeTurn;

        // drawn tiles
        for (const tile of turn.drawnTiles) {
            // remove from player's tile rack
            const indexInTileRack = this.gameState.players[turn.player.toString()].tileRack.indexOf(tile);
            if (indexInTileRack >= 0) {
                this.gameState.players[turn.player.toString()].tileRack.splice(indexInTileRack, 1);
            }

            // add back to tile pouch
            this.gameState.tilePouch.push(tile);
        }
        
        // exchanged tiles
        for (const tile of turn.exchangedTiles) {
            // remove from tile pouch
            const indexInTilePouch = this.gameState.tilePouch.indexOf(tile);
            if (indexInTilePouch >= 0) {
                this.gameState.tilePouch.splice(indexInTilePouch, 1);
            }

            // add back to player's tile rack
            this.gameState.players[turn.player.toString()].tileRack.push(tile);
        }
    }

    private undoChallengeTurn() {
        // get turn details
        const turn = this.gameState.turns[this.gameState.turns.length - 1] as ScrabbleChallengeTurn;

        if (turn.successful) {
            // drawn tiles
            for (const tile of turn.challengedTurn.drawnTiles) {
                // remove from tile pouch
                const indexInTilePouch = this.gameState.tilePouch.indexOf(tile);
                if (indexInTilePouch >= 0) {
                    this.gameState.tilePouch.splice(indexInTilePouch, 1);
                }

                // add back to player's tile rack
                this.gameState.players[turn.challengedTurn.player.toString()].tileRack.push(tile);
            }

            // played tiles
            for (const tile of turn.challengedTurn.playedTiles) {
                // add played tile back to board
                const boardTile: BoardTile = {
                    letter: tile.letter,
                    replacement: tile.replacement
                };
                this.gameState.board[tile.x][tile.y] = boardTile;

                // remove played tile from player's tile rack
                const indexInTileRack = this.gameState.players[turn.challengedTurn.player.toString()].tileRack.indexOf(tile.letter);
                if (indexInTileRack >= 0) {
                    this.gameState.players[turn.challengedTurn.player.toString()].tileRack.splice(indexInTileRack, 1);
                }
            }

            // add points back to player points
            this.gameState.players[turn.challengedTurn.player.toString()].points += turn.challengedTurn.points;

            // unset losesNextTurn for player
            this.gameState.players[turn.challengedTurn.player.toString()].losesNextTurn = false;

            // add challenged turn back to turn list
            this.gameState.turns.splice(this.gameState.turns.length - 1, 0, turn.challengedTurn);
        } else {
            // unset losesNextTurn for challenger
            this.gameState.players[turn.player.toString()].losesNextTurn = false;
        }
    }

    private undoLastTurn(resetTurn = true) {
        // get turn details
        const turn = this.gameState.turns[this.gameState.turns.length - 1];

        // undo turn based on type of turn
        switch (turn.type) {
            case ScrabbleTurnType.Word:
                this.undoPlayWordTurn();
                break;
            case ScrabbleTurnType.Exchange:
                this.undoExchangeTilesTurn();
                break;
            case ScrabbleTurnType.Challenge:
                this.undoChallengeTurn();
                break;
        }

        // remove turn from game history
        this.gameState.turns.splice(this.gameState.turns.length - 1, 1);

        // reset turn 
        if (resetTurn) {
            this.gameState.currentPlayer = turn.player;
        }
    }

    private updateStatus(message: string, showCurrentPlayerTileRack = true) {
        // show message
        let text = message;

        // show current player
        text += `\n\n<@${this.gameState.players[this.gameState.currentPlayer.toString()].userId}> is up!`

        // show board
        text += `\n\n${this.getBoardDisplayString()}`;

        // add player points
        text += '\n\n';
        const playerPoints = [];
        for (let i = 1; i <= 4; i++) {
            const player = this.gameState.players[i.toString()];
            if (player != null) {
                playerPoints.push(`<@${player.userId}>: ${player.points}`);
            }
        }
        text += playerPoints.join(' ');
        
        // show remaining tile count
        text += `\nRemaining Tiles: ${this.gameState.tilePouch.length}`;

        // create new message
        const messageData: SlackMessagePostBody = {
            channel: this.gameState.channel,
            text
        };

        // send message
        this.slackService.postMessage(messageData).then((response) => {
            // delete old status message
            if (this.gameState.statusMessageTS != null) {
                this.slackService.deleteMessage(this.gameState.channel, this.gameState.statusMessageTS);
            }

            // save message timestamp
            this.gameState.statusMessageTS = response.message.ts;
            this.saveGame();

            if (showCurrentPlayerTileRack) {
                this.displayTileRackForPlayer(this.gameState.currentPlayer);
            }
        });
    }

    private sendErrorMessage(userId: string, message: string, channel = null) {
        const messageData: SlackEphemeralMessagePostBody = {
            user: userId,
            channel: channel || this.gameState.channel,
            text: message
        };

        this.slackService.postEphemeralMessage(messageData);
    }

    private checkForSecondaryWord(x: number, y: number, originalDirection: WordDirection): string | null {
        if (originalDirection === WordDirection.Horizontal) {
            // check vertically for words
            let newY = y;
            
            // find beginning of potential word
            while (this.gameState.board[x][newY] != null) {
                newY -= 1;
            };

            // adjust to get actual start of word
            newY += 1;

            // save new word
            let word = '';
            while (newY >= 0 && newY <= 14 && this.gameState.board[x][newY] != null) {
                const boardTile = this.gameState.board[x][newY];
                word += boardTile.letter;
                if (boardTile.replacement != null) {
                    word += boardTile.replacement;
                }
                newY += 1;
            }

            // words must be at least two characters
            if (word.split('_').join('').length > 1) {
                return word;
            }
        } else {
            // check horizontally for words
            let newX = x;
            
            // find beginning of potential word
            while (this.gameState.board[newX][y] != null) {
                newX -= 1;
            };

            // adjust to get actual start of word
            newX += 1;

            // save new word
            let word = '';
            while (newX >= 0 && newX <= 14 && this.gameState.board[newX][y] != null) {
                const boardTile = this.gameState.board[newX][y];
                word += boardTile.letter;
                if (boardTile.replacement != null) {
                    word += boardTile.replacement;
                }
                newX += 1;
            }

            // words must be at least two characters
            if (word.split('_').join('').length > 1) {
                return word;
            }
        }

        return null;
    }

    undo(channel: string, userId: string) {
        if (!this.loadGame(channel)) {
            this.sendErrorMessage(userId, 'There is no active game in this channel', channel);
            return;
        }

        // verify the user is in the game
        const playerIndex = this.findIndexOfPlayerWithId(userId);
        if (playerIndex == null) {
            this.sendErrorMessage(userId, 'You are not part of this game');
            return;
        }

        // verify user was the last player
        // const lastTurn = this.gameState.turns[this.gameState.turns.length - 1];
        // if (playerIndex !== lastTurn.player) {
        //     this.sendErrorMessage(userId, 'You can only undo your turns');
        //     return;
        // }

        this.undoLastTurn();
        this.saveGame();

        if (this.gameState.turns.length > 0) {
            this.updateStatus(`The last move was reverted\n\n${this.gameState.turns[this.gameState.turns.length - 1].statusMessage}`);
        } else {
            this.updateStatus('The last move was reverted');
        }
    }

    // word list from first answer in https://boardgames.stackexchange.com/questions/38366/latest-collins-scrabble-words-list-in-text-file
    private isWordInDictionary(word: string): boolean {
        // load word list
        if (this.dictionaryWords == null) {
            const gameDataFolder = config.games.dataDirectory;
            this.dictionaryWords = fs.readFileSync(`${gameDataFolder}/scrabble-words.txt`, 'utf-8')
                .split('\n').map(x => x.replace(/[\n\t\r]/g, ''));
        }

        // check if dictionary contains word
        if (this.dictionaryWords.includes(word.toUpperCase())) {
            return true;
        }

        return false;
    }

    challenge(channel: string, userId: string) {
        if (!this.loadGame(channel)) {
            this.sendErrorMessage(userId, 'There is no active game in this channel', channel);
            return;
        }

        // verify the user is in the game
        const playerIndex = this.findIndexOfPlayerWithId(userId);
        if (playerIndex == null) {
            this.sendErrorMessage(userId, 'You are not part of this game');
            return;
        }
        
        // get the details of the last turn
        const lastTurn = this.gameState.turns[this.gameState.turns.length - 1];
        
        // prevent players from challenging their own moves
        if (playerIndex === lastTurn.player) {
            this.sendErrorMessage(userId, 'You cannot challenge your own move');
            return;
        }

        // prevent duplicate challenges
        if (lastTurn.type === ScrabbleTurnType.Challenge) {
            this.sendErrorMessage(userId, 'The last move has already been challenged');
            return;
        }

        // ensure last move was playing a word
        if (lastTurn.type !== ScrabbleTurnType.Word) {
            this.sendErrorMessage(userId, 'Unable to challenge the last move');
            return;
        }

        // check the words made in the last move
        for (const word of (lastTurn as ScrabblePlayWordTurn).words) {
            if (!this.isWordInDictionary(word)) {
                // successful challenge
                this.undoLastTurn();
                this.incrementTurn();
                
                const statusMessage = `<@${userId}> successfully challenged <@${this.gameState.players[lastTurn.player.toString()].userId}>'s move. ${this.textHelper.textToScrabbleTiles(word)} is not in the scrabble dictionary. <@${this.gameState.players[lastTurn.player.toString()].userId}> has lost their turn.`;

                // save challenge as a turn 
                const turn: ScrabbleChallengeTurn = {
                    type: ScrabbleTurnType.Challenge,
                    player: playerIndex,
                    userId,
                    challengedTurn: (lastTurn as ScrabblePlayWordTurn),
                    successful: true,
                    statusMessage
                };
                this.gameState.turns.push(turn);

                this.saveGame();

                this.updateStatus(statusMessage, playerIndex !== this.gameState.currentPlayer);
                return;
            }
        }

        // failed challenge
        if (playerIndex === this.gameState.currentPlayer) {
            this.incrementTurn();
        } else {
            this.gameState.players[playerIndex.toString()].losesNextTurn = true;
        }

        const statusMessage = `<@${userId}> failed to challenge <@${this.gameState.players[lastTurn.player.toString()].userId}>'s move. All word(s) are in the scrabble dictionary. <@${userId}> has lost their next turn.`;

        const turn: ScrabbleChallengeTurn = {
            type: ScrabbleTurnType.Challenge,
            player: playerIndex,
            userId,
            challengedTurn: (lastTurn as ScrabblePlayWordTurn),
            successful: false,
            statusMessage
        };
        this.gameState.turns.push(turn);

        this.saveGame();
        this.updateStatus(statusMessage, playerIndex !== this.gameState.currentPlayer);
    }
}

// TODO: handle creating new games in channels that already have a game
// TODO: status message (for all users?)?
// TODO: randomize next turn, game over, new game messages?
// TODO: create command documentation
// TODO: ephemeral response with command to avoid having to type the whole thing out again?
// TODO: endgame statistics - highest scoring move, longest word