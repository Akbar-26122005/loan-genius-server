const {startServer, app} = require('./api/app')
const serverless = require('serverless-http');

// startServer(5000);
module.exports = serverless(app)