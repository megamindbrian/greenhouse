// TODO: other types of failures, not checking temperature within the last hour, web server timeout
// TODO: use this tutorial to power the humidity sensor, http://my.safaribooksonline.com/book/hardware/raspberry-pi/9781449365288/8dot-gpio-basics/sec6_8_html


var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var server;

require('./start-pfio.js');
require('./start-dht22.js');

// Watch for Ctrl+C
process.on('SIGINT', stopListening);

startListening();

function startListening() {

    console.log('starting web server');
    // start http server
    server = connect().use(serveStatic(__dirname + '/client'))
        .use(function (req, res) {
            if(req.url == '/plugins')
            {
                res.data = {};
                server.emit('plugins', req, res);
                res.end(JSON.stringify(res.data));
            }

            server.emit('connect', req, res);
        })
        .listen(80, '192.168.1.180', function () {
            console.log((new Date()) + ' Server is listening on port 80');
            exports.server = server;
            process.emit('listen', server);
        });

}

function stopListening() {
    process.emit('closing');
    console.log('server ending');
    server.close();
    setTimeout(function () {
        process.exit();
    }, 1000);
}
