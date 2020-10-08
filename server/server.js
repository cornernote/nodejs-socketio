/**
 * Node.js Socket.io Server
 */

'use strict';

console.log('Node.js Socket.io Server');

const PORT = 443;
const SECRET = 'INSERT_SECRET_HERE'; // matches client secret
const REDIS = 'redis';

let users = {};
let sockets = {};

const obj2Json = function (j) {
    let dq = '"';
    let json = "{";
    let last = Object.keys(j).length;
    let count = 0;
    for (let x in j) {
        if (j[x] !== null && typeof j[x] === 'object') {
            json += dq + x + dq + ":" + obj2Json(j[x]);
        } else {
            json += dq + x + dq + ":" + dq + j[x] + dq;
        }
        count++;
        if (count < last)
            json += ",";
    }
    json += "}";
    return json;
};

// handle socket.io over https
const fs = require('fs');
const httpsApp = require('https').createServer({
    cert: fs.readFileSync(process.cwd() + '/ssl/fullchain.pem'), // + "\n\n" + fs.readFileSync(process.cwd() + '/ca-bundle')
    key: fs.readFileSync(process.cwd() + '/ssl/privkey.pem')
});
httpsApp.listen(PORT, function () {
    console.log('HTTPS:' + PORT);
});
const io = require('socket.io').listen(httpsApp);
const ioJwt = require('socketio-jwt');
const redis = require('redis');
const redisCache = redis.createClient({host: REDIS});
io.origins('*:*');
io.sockets.on('connection', ioJwt.authorize({secret: SECRET, timeout: 15000}));
io.sockets.on('authenticated', function (socket) {
    // handle user connections
    let data = socket.decoded_token;
    if (typeof data.user === 'undefined') return; // for old connections (can be removed)
    if (!users[data.user.id]) {
        users[data.user.id] = [];
    }
    sockets[socket.id] = socket;
    users[data.user.id][socket.id] = data;
    redisCache.set('sockets', obj2Json(users));
    // handle disconnection
    socket.on('disconnect', function () {
        delete sockets[socket.id];
        delete users[data.user.id][socket.id];
        redisCache.set('sockets', obj2Json(users));
        io.sockets.emit('socket', {
            socketCount: Object.keys(sockets).length,
            userCount: Object.keys(users).length,
        });
    });
    // tell the user some info
    io.sockets.emit('socket', {
        socketCount: Object.keys(sockets).length,
        userCount: Object.keys(users).length,
    });
});


// handle broadcasts from php via redis
const redisSubscribe = redis.createClient({host: REDIS});
redisSubscribe.subscribe('socket');
redisSubscribe.on('message', function (channel, message) {
    if (channel === 'socket') {
        message = JSON.parse(message);
        // debug({
        //     action: message.action,
        //     data: message.data,
        //     users: message.users.length ? message.users : 'all'
        // });
        if (message.users.length) {
            for (let i = 0; i < message.users.length; i++) {
                let user = users[message.users[i]];
                for (let socket_id in user) {
                    if (user.hasOwnProperty(socket_id) && sockets.hasOwnProperty(socket_id)) {
                        sockets[socket_id].emit(message.action, message.data);
                    }
                }
            }
        }
        else if (io.sockets) {
            io.sockets.emit(message.action, message.data);
        }
    }
});