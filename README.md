# shtbot
SHT slackbot

## Slash Commands
* /mock - convert text to Mocking SpongeBob format
* /sayas - impersonates another workspace user
* /scrabble - converts and displays text as scrabble emojis (requires scrabble emojis to be present in slack workspace)

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