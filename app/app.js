var express = require('express');
var sockets = require('socket.io');
var http = require('http');
var _ = require('underscore');

var app = express();
var server = http.createServer(app);
var enableLogging = true;

/* istanbul ignore next */
app.configure('production', function() { enableLogging = true; });
app.configure('test', function() { enableLogging = false; });

var io = sockets.listen(server, { log: enableLogging });

// Routes
// app.get('/', function(req, res) { res.redirect('/conversation'); });
app.get('/hello', require("./route-hello"));

// Sockets
var chat_server = require('./chat-server.js');
chat_server(_, io);

// Resources
app.use('/style', express.static(__dirname + '/../public/style'));
app.use('/img', express.static(__dirname + '/../public/img'));
app.use('/lib', express.static(__dirname + '/../public/lib'));

// Client
app.use('/', express.static(__dirname + '/../public/conversation'));


module.exports = server;
