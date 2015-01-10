module.exports = function(_, io) {
    // Maintains user data
    // key: socket.id
    // value: hash of user data
    var users = {};
    var serverName = 'server';

    io.on('connection', function(socket) {
        socket.on('can_register', function(data) {
            var username = data.username;

            var canRegister = !_.contains(users, username);

            socket.emit('notify', {
                type: 'ACT',
                success: canRegister,
                username: username
            });
        });

        // Add to list of users
        socket.on('register', function(data) {
            var numberOfUsers = _.size(users);
            var username = data.username;
            users[socket.id] = { username: username };

            var status;
            if( numberOfUsers > 0 ) {
                status = numberOfUsers + " other user"
                status += (numberOfUsers > 1) ? 's' : '';
                status += " in the conversation.";
            } else {
                status = "Nobody currently in conversation right now.";
            }

            socket.emit('notify', {
                type: 'MSG',
                messages: [
                    'Welcome.',
                    // 'Hello, ' + username + '.'
                    status
                ],
                source: serverName
            });

            socket.broadcast.emit('notify', {
                type: 'MSG',
                message: username + " has joined the conversation.",
                source: serverName
            });
        });

        // Pass on messages to all clients
        socket.on('message', function(data) {
            io.sockets.emit('notify', data);
        });

        // Remove user when they disconnect
        socket.on('disconnect', function () {
            var user = users[socket.id];
            var username = (user && user.username) ? user.username : null;
            if( username ) {
                io.sockets.emit('notify', {
                    type: 'MSG',
                    message: username + " has left the conversation.",
                    source: serverName
                });
                delete users[socket.id];
            } else {
                // Tried to delete a user who hasn't registered yet
            }
        });
    });
};
