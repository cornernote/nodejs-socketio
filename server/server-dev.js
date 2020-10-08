
zUtil = {};
const util = require('util');
zUtil.showMemory = function (){
    console.log('Memory Usage: ' + util.inspect(process.memoryUsage()));
};
zUtil.showMessageAndMemory = function(message){
    console.log(message);
    this.showMemory();
};

zUtil.showMemory();
var secret = 'ABC123';
var express = require('express');
var eapp = express();
var http = require('http').Server(eapp);
//var io = require('socket.io')(http);
var jwt = require('jsonwebtoken');
var iojwt = require('socketio-jwt');
var bodyParser = require('body-parser');
var userSockets = {};

// ssl certificate
var fs = require('fs');

var options = {
    key: fs.readFileSync(process.cwd() + '/ssl/wildcard.key'),
    cert: fs.readFileSync(process.cwd() + '/ssl/wildcard.crt'),
    ca: fs.readFileSync(process.cwd() + '/ssl/wildcard.ca-bundle')
};
options.cert = options.cert + "\n\n" +  options.ca;
// create https app and socket.io
var app = require('https').createServer(options);
app.listen(50443);
var io = require('socket.io').listen(app);

// manage the users sockets
io.sockets.on('connection',
//this is called when connection occurs
    iojwt.authorize({secret: secret, timeout: 15000}))
    //below does not work although it is an equivalant call

    //        (function(){
    //      console.log(iojwt);
    //      console.log(secret);
    //      return iojwt.authorize({secret: secret, timeout: 15000})
    //  }))
    //io sockets has addition even listener listening for authentication
    //This is triggered when io.sockets authorized is successful
    .on('authenticated', function (socket) {
        var user_id = socket.decoded_token;
        zUtil.showMessageAndMemory('connection - user_id=' + user_id + ' total connections were ' + Object.keys(userSockets).length);
        if (!userSockets[user_id]) {
            userSockets[user_id] = [];
        }
        userSockets[user_id][socket.id] = socket;
        socket.on('disconnect', function () {
            zUtil.showMessageAndMemory('disconnect - user_id=' + user_id + ' total connections were ' + Object.keys(userSockets).length);
            delete userSockets[user_id][socket.id];
        });
    });

// php server will call this to broadcast to sockets
eapp.use(bodyParser.urlencoded({extended: true}));
eapp.post('/data', function (req, res) {
    //console.log('post data');
    //console.log(req.body);
    jwt.verify(req.body.token, secret, function (err, decoded) {
        if (decoded !== secret) {
            return;
        }
        //console.log('jwt verifying');
        if (req.body.users) {
            //console.log("users " + req.body.users);
            for (var i = 0; i < req.body.users.length; i++) {
                //console.log("users looping");
                var user_id = req.body.users[i];
                var sockets = userSockets[user_id];
                //console.log('user_id' + user_id + ' userSockets');
                //console.log(userSockets);
                for (var socket_id in sockets) {
                    if (sockets.hasOwnProperty(socket_id)) {
                        zUtil.showMessageAndMemory('emit - controller=' + req.body.controller + 'action=' + req.body.action + ' user_id=' + user_id + ' socket_id=' + sockets[socket_id].id + ' total connections were ' + Object.keys(userSockets).length);
                        sockets[socket_id].emit('data', {controller: req.body.controller, action: req.body.action, data: req.body.data});
                    }
                }
            }
        }
        else {
            //console.log("else");
            if (io.sockets){
                //console.log('socket');
                var payLoad = {controller: req.body.controller, action: req.body.action, data: req.body.data};
                //console.log('emiting data payload');
                //console.log(payLoad);
                io.sockets.emit('data', payLoad);
            }
            else{
                zUtil.showMessageAndMemory("no io socket");
            }

        }
    });
    res.end();
});

// create http app
http.listen(5080);
zUtil.showMemory();