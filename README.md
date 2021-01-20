# shtbot
SHT slackbot

## Slash Commands
* /fire - tells a user to "GTFO" with a gif from Giphy (Giphy Beta API key is limited to 42 requests an hour and 1000 requests a day)
* /mock - convert text to Mocking SpongeBob format
* /sayas - impersonates another workspace user
* /tile - converts and displays text as scrabble emojis (requires scrabble emojis to be present in slack workspace)

## Other Features
* delete bot messages by reacting with the 'x' emoji
* randomly jumps on the :badalec: reaction train

## TODO
* fix logger.error() output

## Development 
How to setup a local development environment

### Setup
1. Clone the repository
2. Run `yarn` to install dependencies
3. Get bot user token and slack signing secret from app settings page
4. Start project with `BOT_USER_TOKEN="<token>" SLACK_SIGNING_SECRET="<secret>" yarn start`
5. ???
6. Git Gud
7. ???
8. Profit

### Available environment variables
| Variable | Data Type | Default | Description |
|:---------|:----------|:--------|:------------|
| LOGGER_LEVEL | string | debug | controls file system log level |
| CONSOLE_LOGGER_LEVEL | string | verbose | controls console log level |
| LOGGER_DIRECTORY | string | ./logs | controls where file system logs are stored |
| SERVER_HOST | string | 0.0.0.0 | controls what host the server listens on |
| SERVER_PORT | number | 3000 | controls what port the server listens on |
| BOT_USER_TOKEN | string | | authentication token for slack API |
| SLACK_SIGNING_SECRET | string | | secret used to validate slack webhook requests | 
| GIPHY_API_KEY | string | | api key for Giphy |
| GAME_DATA_DIRECTORY | string | ./data/games | controls where game data is stored |

## Games
### Scrabble
* `/scrabble new <tagged player list>`: creates a new game with 1-4 players
* `/scrabble play (startX, startY) (endX, endY) <word> <replacements>`: plays the specified word on the board
  * replacements are only used if playing a blank tile
  * x values are 0-14 left to right
  * y values are 0-14 from top to bottom
* `/scrabble exchange <tiles>`: returns specified tiles to the tile pouch and draws new ones
* `/scrabble challenge`: challenges the last word played
* `/scrabble pass`: pass your current turn (though you'd probably want to exchange tiles if there are still some left)
* `/scrabble tiles`: displays your tile rack
* `/scrabble reorder <tiles>`: reorders your tile rack
