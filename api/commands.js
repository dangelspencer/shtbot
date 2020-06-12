const routes = [
    {
        method: 'POST',
        path: '/scrabble',
        handler: async (request) => {
            const textToConvert = request.payload.text;
            const channel = request.payload.channel_id;

            let result = '';
            let skip = ['.', ',', '\'', '?', '-'];
            let numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

            for (let i = 0; i < textToConvert.length; i++) {
                let char = textToConvert.charAt(i).toLowerCase();
                if (skip.includes(char)) {
                    continue;
                }
                if (char === ' ') {
                    result += '   ';
                    continue;
                }
                if (!isNaN(parseInt(char, 10))) {
                    result += `:${numbers[parseInt(char, 10)]}:`;
                    continue;
                }
                char = ['a', 'b', 'm', 'o', 'v', 'x'].includes(char) ? char+char : char;
                result += (`:${char}:`);
            }

            const slackService = await request.app.getNewSlackService();
            const user = await slackService.getUserById(request.payload.user_id);

            await slackService.postToChannel({
                response_type: 'in_channel',
                text: result,
                username: user.profile.real_name,
                icon_url: user.profile.image_original,
                channel
            });

            return '';
        }
    }
];

module.exports = routes.map(route => {
    return { ...route, path: `/commands${route.path}` };
});
