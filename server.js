
//SERVER SCRIPT
//must also install connect and serve-static
//instructions can be found here https://stackoverflow.com/questions/6084360/using-node-js-as-a-simple-web-server

var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(8000, function () {
    console.log('Server running on 8000...');
});