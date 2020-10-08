"use strict"

//'https://unpkg.com/vue-socket.io-extended@3.2.1/dist/vue-socket.io-ext.min.js',
// alternative https://cdn.jsdelivr.net/npm/vue-socket.io-extended


// vue socket
Vue.use(VueSocketIOExt, socketApp.io, vueStore);
const vueSockets = {
    connect: function () {
        console.log('vue:io:connect')
    },
    // receive message from Socket::broadcast('model')
    model: function (message) {
        if (!message.value) {
            this.$store.commit('delete', message.key);
        } else {
            this.$store.commit('save', message);
        }
    }
};

