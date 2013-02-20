// Get the express working!
var express = require('express'),
    app = express(),
    server = require('http').createServer(app)

app.use(express.static(__dirname + '/public')

