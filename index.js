var workers = require('./lib/workers');
var server = require('./lib/server');

var app = {}

app.init = function(){
    server.init();

 //  workers.init();
};

app.init();

module.exports = app;