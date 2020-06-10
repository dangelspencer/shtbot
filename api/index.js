const fs = require('fs');
const path = require('path');
const basename = path.basename(module.filename);

const plugin = {
    name: 'platform-api-routes',
    register: (server) => {
        fs
            .readdirSync(__dirname)
            .filter(function(fileName) {
                return (fileName.indexOf('.') !== 0) && (fileName !== basename) && (fileName.slice(-3) === '.js');
            })
            .forEach(function(fileName) {
                server.route(require(path.join(__dirname, fileName)));
            });
    }
};

module.exports = {
    plugin: plugin,
    options: {},
    routes: {
        prefix: '/api'
    }
};
