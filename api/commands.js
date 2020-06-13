const routes = [
    {
        method: 'POST',
        path: '/scrabble',
        handler: async (request) => {
            const textToConvert = request.payload.text;
            const channel = request.payload.channel_id;

            const textConverterHelper = await request.app.getNewTextConverterHelper();
            const result = await textConverterHelper.textToScrabbleTiles(textToConvert);

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
