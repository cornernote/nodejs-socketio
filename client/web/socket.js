"use strict"

const socketApp = {
    io: null,
    active: true,
    connect: function () {
        let self = this;
        if (self.io) {
            self.io.destroy();
            delete self.io;
            self.io = null;
        }
        try {
            this.io = io.connect(socketConfig.socketUrl, {
                secure: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: Infinity,
                transports: ['websocket']
            });
            // connect
            this.io.on('connect', function () {
                console.log('io:connect');
                self.io.emit('authenticate', {token: socketConfig.socketToken});
            });
            // disconnect
            this.io.on('disconnect', function () {
                if (self.active) {
                    console.log('io:disconnect');
                    window.setTimeout('socketApp.connect()', 5000);
                }
            });
            // receive data from socket after connection
            this.io.on('socket', function (data) {
                console.log('io:socket');
                console.log(data);
                document.getElementById('userCount').innerHTML = data.userCount;
                document.getElementById('socketCount').innerHTML = data.socketCount;
            });
            // receive data from Socket::broadcast('refresh')
            this.io.on('reload', function (data) {
                console.log('io:reload');
                window.location.reload();
            });
            // receive data from Socket::broadcast('alert')
            this.io.on('alert', function (data) {
                console.log('io:alert');
                console.log(data);
                alert(data.message);
            });
        } catch (e) {
            this.active = false;
            console.log('io:error');
        }
    },
    disconnect: function () {
        this.active = false;
        if (this.io) {
            this.io.disconnect();
        }
    }
};
socketApp.connect();

$(window).on('beforeunload', function () {
    console.log('io:unload');
    socketApp.disconnect();
});
