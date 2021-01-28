export interface GameState {
    board: BoardTile[][];
    channel: string;
    players: {
        '1': ScrabblePlayer;
        '2': ScrabblePlayer;
        '3'?: ScrabblePlayer;
        '4'?: ScrabblePlayer;
    }
    currentPlayer: number;
    tilePouch: string[];
    turns: ScrabbleTurn[];
    statusMessageTS: string;
    inProgress: boolean;
}

export interface ScrabblePlayer {
    userId: string;
    tileRack: string[];
    points: number;
    losesNextTurn: boolean;
    passedLastTurn: boolean;
    adjustedPoints: number;
}

export enum BoardSpace {
    Center,
    DoubleLetter,
    DoubleWord,
    TripleLetter,
    TripleWord,
    Blank
}

export enum WordDirection {
    Vertical,
    Horizontal
}

export interface Tile {
    x: number;
    y: number;
    letter: string;
    inRack: boolean;
    isOnBoard: boolean;
    replacement: string;
}

export interface BoardTile {
    letter: string;
    replacement: string;
}

export enum ScrabbleTurnType {
    Challenge,
    Exchange,
    Pass,
    Word
}

export interface ScrabbleTurn {
    type: ScrabbleTurnType;
    userId: string;
    player: number;
    statusMessage: string;
}

export interface ScrabblePlayWordTurn extends ScrabbleTurn {
    words: string[];
    points: number;
    drawnTiles: string[];
    playedTiles: Tile[];
}

export interface ScrabbleExchangeTurn extends ScrabbleTurn {
    exchangedTiles: string[];
    drawnTiles: string[];
}

export interface ScrabbleChallengeTurn extends ScrabbleTurn {
    challengedTurn: ScrabblePlayWordTurn;
    successful: boolean;
}

export interface ScrabblePassTurn extends ScrabbleTurn {
    passed: boolean;
}

// export interface ScrabblePassTurn extends ScrabbleTurn {}