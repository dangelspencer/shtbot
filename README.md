# shtbot
SHT shitposting slackbot

## Slash Commands
* /mock - convert text to Mocking SpongeBob format
* /sayas - impersonates another workspace user
* /scrabble - play Scrabble in slack
* /tile - converts and displays text as scrabble emojis (requires scrabble emojis to be present in slack workspace)

## Other Features
* delete bot messages by reacting with the 'x' emoji

### Games

#### Scrabble
Play scrabble in slack!  

Sub-commands:
* /scrabble new-game < @user, ... > - starts a new game in the current channel
* /scrabble < rack | tiles > - shows the user's current tile rack
* /scrabble reorder < new tile order > - reorders the tiles in the user's tile rack (tiles must be separated by a space)
* /scrabble exchange < tiles to exchange > - exchanges up to all of the tiles in the user's tile rack for new tiles (tiles must be separated by a space)