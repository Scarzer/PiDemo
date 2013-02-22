var fs = require('fs'),
    events = require('events'),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

var loggedData = fs.readFileSync('loggedData.js').toString().split('\n,\n');

app.use(express.static(__dirname + '/public'));
server.listen(80);

console.log('starting shit');

io
    .of('/voltSock')
    .on('connection', function(socket){
    var counter = 0;
    console.log('We started!');
    var foo = setInterval(function(){
        socket.emit('info', { count:counter, payload:JSON.parse( loggedData[counter] ) } );
        counter++;
    },2000);
    
    socket.on('disconnect', function(){
        clearInterval(foo);
    });
});

        


