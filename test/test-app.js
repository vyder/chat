var request = require("supertest");
var express = require("express");
var should = require("should");
var _ = require("underscore");
var io = require('socket.io-client');

// Start app in test environment
process.env.NODE_ENV = 'test';
var app = require("../app/app.js");
var PORT = process.env.PORT || 3000;
app.listen(PORT);
var socketURL = 'http://localhost:' + PORT;

var options = {
  transports: ['websocket'],
  'force new connection': true
};

before(function() {
    // Bring the ruckus
})

describe('Test static paths', function() {
    describe('Says hello', function() {
        it('responds with plain text', function(done) {
            request(app)
                .get('/hello')
                .expect(200, done);
        });
    });

    describe("Root responds with a 200", function() {
        it('responds with 200', function(done) {
            request(app)
                .get('/')
                .expect(200, done);
        });
    });
});

describe('Conversations', function() {
    it('A client can connect to chat server', function(done) {
        var client = io.connect(socketURL, options);
        client.on('connect', function() {
            should(true).ok;
            client.disconnect();
            done();
        });
    });

    it('A client can ask to register on the server', function(done) {
        var client = io.connect(socketURL, options);
        var username = 'Vidur';

        client.on('connect', function() {
            client.on('notify', function(data) {
                data.should.have.property('type', 'ACT');
                data.should.have.property('success', true);
                data.should.have.property('username', username);
                client.disconnect();
                done();
            });
            client.emit('can_register', { username: username });
        });
    });

    it('A client can register on the server', function(done) {
        var client = io.connect(socketURL, options);
        var username = 'Vidur';

        client.on('connect', function() {
            client.on('notify', function(data) {
                data.should.have.property('type');

                if( data.type === 'ACT' ) {
                    data.should.have.property('success', true);
                    data.should.have.property('username', username);
                    client.emit('register', { username: username });
                } else if( data.type === 'MSG' ) {
                    data.should.have.property('messages');
                    data.should.have.property('source', 'server');
                    client.disconnect();
                    done();
                }
            });
            client.emit('can_register', { username: username });
        });
    });

    it('Two clients can connect to the chat server', function(done) {
        var client1 = io.connect(socketURL, options);
        var username1 = 'Harry';
        var username2 = 'Ron';

        client1.on('connect', function() {
            client1.on('notify', function(data) {
                data.should.have.property('type');

                if( data.type === 'ACT' ) {
                    data.should.have.property('success', true);
                    data.should.have.property('username', username1);
                    client1.emit('register', { username: username1 });
                } else if( data.type === 'MSG' ) {
                    data.should.have.property('messages');
                    data.should.have.property('source', 'server');

                    // Connect second client now
                    var client2 = io.connect(socketURL, options);

                    client2.on('connect', function() {
                        client2.on('notify', function(data) {
                            data.should.have.property('type');

                            if( data.type === 'ACT' ) {
                                data.should.have.property('success', true);
                                data.should.have.property('username', username2);
                                client2.emit('register', { username: username2 });
                            } else if( data.type === 'MSG' ) {
                                data.should.have.property('messages');
                                data.should.have.property('source', 'server');

                                // Both clients have connected successfully
                                client1.disconnect();
                                client2.disconnect();
                                done();
                            }
                        });
                        client2.emit('can_register', { username: username2 });
                    });
                }
            });
            client1.emit('can_register', { username: username1 });
        });
    });

    it('More than two clients can connect to the chat server', function(done) {
        var client1 = io.connect(socketURL, options);
        var username1 = 'Harry';
        var username2 = 'Ron';
        var username3 = 'Hermione';

        var hasVerifiedTest = false;

        client1.on('connect', function() {
            client1.on('notify', function(data) {
                data.should.have.property('type');

                if( data.type === 'ACT' ) {
                    data.should.have.property('success', true);
                    data.should.have.property('username', username1);
                    client1.emit('register', { username: username1 });
                } else if( data.type === 'MSG' ) {
                    data.should.have.property('source', 'server');

                    // Connect second client now
                    var client2 = io.connect(socketURL, options);

                    client2.on('connect', function() {
                        client2.on('notify', function(data) {
                            data.should.have.property('type');

                            if( data.type === 'ACT' ) {
                                data.should.have.property('success', true);
                                data.should.have.property('username', username2);
                                client2.emit('register', { username: username2 });
                            } else if( data.type === 'MSG' ) {
                                data.should.have.property('source');

                                // Connect second client now
                                var client3 = io.connect(socketURL, options);

                                client3.on('connect', function() {
                                    client3.on('notify', function(data) {
                                        data.should.have.property('type');

                                        if( data.type === 'ACT' ) {
                                            data.should.have.property('success', true);
                                            data.should.have.property('username', username3);
                                            client3.emit('register', { username: username3 });
                                        } else if( data.type === 'MSG' ) {
                                            data.should.have.property('source');

                                            if( !hasVerifiedTest ) {
                                                // All clients have connected successfully
                                                client1.disconnect();
                                                client2.disconnect();
                                                client3.disconnect();
                                                hasVerifiedTest = true;

                                                done();
                                            }
                                        }
                                    });
                                    client3.emit('can_register', { username: username3 });
                                });
                            }
                        });
                        client2.emit('can_register', { username: username2 });
                    });
                }
            });
            client1.emit('can_register', { username: username1 });
        });
    });

    it('Messages sent by one client are correctly received by other clients', function(done) {
        var client1 = io.connect(socketURL, options);
        var username1 = 'Harry';
        var username2 = 'Ron';
        var testMessage = "'ello, Harry!";

        client1.on('connect', function() {
            client1.on('notify', function(data) {
                data.should.have.property('type');

                if( data.type === 'ACT' ) {
                    data.should.have.property('success', true);
                    data.should.have.property('username', username1);
                    client1.emit('register', { username: username1 });
                } else if( data.type === 'MSG' ) {
                    data.should.have.property('source');

                    if( data.source !== 'server' ) {
                        data.should.have.property('source', username2);
                        data.should.have.property('message', testMessage);
                        done();
                    }
                }
            });
            client1.emit('can_register', { username: username1 });
        });

        // Connect second client now
        var client2 = io.connect(socketURL, options);
        var sentMessage = false;

        client2.on('connect', function() {
            client2.on('notify', function(data) {
                data.should.have.property('type');

                if( data.type === 'ACT' ) {
                    data.should.have.property('success', true);
                    data.should.have.property('username', username2);
                    client2.emit('register', { username: username2 });
                } else if( data.type === 'MSG' ) {
                    data.should.have.property('source');

                    if( data.source === 'server' && !sentMessage ) {
                        client2.emit('message', {
                            type: 'MSG',
                            message: testMessage,
                            source: username2
                        });
                        sentMessage = true;
                    }
                }
            });
            client2.emit('can_register', { username: username2 });
        });
    });

});

after(function() {
    // Teardown some shit
});
