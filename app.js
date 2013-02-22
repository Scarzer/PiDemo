// Current status
// --------------------
// I'm writing to a file, but it will fill up really fast
// I am not emitting any sockets yet
// I am not plotting anything
//
// I am getting the data, and there is a sufficient mix of both current and voltage
// The code isn't really well organized
//



// Socket IO and express
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server)

// Modules that are come from builtin stuff    
var exec = require('child_process').exec,
    fs = require('fs'),
    events = require('events'),
    ductTape = new events.EventEmitter;

// Config file accessing
var config = require('./config'),
    serialSet = config.serial, //Serial Settings
    dbFile = config.logFile,
    hoursBk = config.hoursBack;

// Serial Port shits
var serialport = require('serialport')
    SerialPort = serialport.SerialPort
    serial = new SerialPort(config.port, {
        baudrate : 115200,
        parser : serialport.parsers.readline('\n')
        });

// Global scope variables 
var clients = {},
    dataPacket = { /* data packet that will be populated by each serial call */
        type : undefined,  
        time : undefined, 
        current: undefined,
        board1 : undefined, 
        board2 : undefined, 
        board3 : undefined, 
        board4 : undefined, 
        board5 : undefined, 
        board6 : undefined, 
        board7 : undefined, 
        board8 : undefined,
        totVolt : undefined,
        };
    
    pastData = undefined;


// The boilerplate actually works right now. DON'T MODIFY ABOVE HERE!!!!
// --------------------------------------------------------------------




// Useful functions and the body will go right down here! 
// --------------------------------------------------------------------

// getting the past data. Now lets make it into a json of arrays!
// Pass the data file, and it'll return an array made up of:
// [time, power]
// [time, totVolt]
// [time, current]
//
// It's just an annon file... dun kno why. It doens't have to be

var pastDataPower = (function(dbFile){
    var finalArray = [];
    exec('tail -n 100 ' + dbFile, function(err, stdout, stderr){
        var outP = stdout.split('\n');
        outP.pop()
        var mapOut = outP.map( function(value, index){
            var x = JSON.parse(value);
            var xArray = [ [x.time, x.totVolt], [x.time, x.current], [x.time, x.power] ] ;
           // console.log("Value: " + value + " Type: " + typeof(value));
           // console.log("X: " + x + " Type: " + typeof(x));
           // console.log("xArray: " + xArray + " Type: " + typeof(xArray));
            return xArray
            })
        //console.log(JSON.stringify(mapOut));
        console.log('emitted pastData');
        ductTape.emit('pastDataPower', mapOut);
    })

})

// --------------------------------------------------------------------
//// Main body of the code is right here now! /////////////////////////
// ---------------------------------------------------------------------

// Express routing and body parsing
//

app.use(express.static(__dirname + '/public'));


server.listen(80);
// Serial communication event handlers RIGHT HERE!!!
// ---------------------------------------------------------------------



serial.on('open', function(){
    console.log('Serial port: ' + config.port + ' was opened');
    serial.on('data', function(data){
        //console.log(data.toString());
        var inter = data.toString().split(','); //split the data into a csv string
        console.log(data);
        inter.forEach(function(value, index){
            
            if(value === 'C'){
                dataPacket['type'] = 'current';
            }

            else if(value === 'V'){
                dataPacket['type'] = 'voltage';
            }

            if(value === '\n') return;

            if(dataPacket['type'] === 'current'){
                if(index === 1) dataPacket['current'] = value;
                if(index === 2) dataPacket['totVolt'] = value;
                }

            else if(dataPacket['type'] === 'voltage'){
                dataPacket['board'+index] = parseFloat(value);

                 }
        });

        console.log(dataPacket)
        dataPacket['time'] = Date.now();
        dataPacket['power'] = dataPacket['totVolt'] * dataPacket['current']
        ductTape.emit('packet', dataPacket.type);
    });
});

serial.on('error', function(err){
    console.log('There was an error: ' + err);
    throw err;
});

// Sockets are right here!!! 

/*
io.sockets.on('connection', function(socket){
     
    pastData(dbFile)
    ductTape.on('pastData', function(theData){
        console.log("Data4321");
        console.log(theData);
        socket.emit('init', {hours: hoursBk,
                    oldData: theData });
        })

    ductTape.on('packet', function(type){
        socket.emit('info', dataPacket);
        console.log('emitted: ' + dataPacket.type);
    });
});
*/

var voltClients = {}
var voltSock = io
    .of('/voltSock')
    .on('connection', function (socket){
        voltClients[socket.id] = socket;
        console.log("Someone connected to /Volt");
        

        socket.on('disconnect', function(){
            delete voltClients[socket.id]
        })
    });

var powerClients = {}
var powerSock = io
    .of('/powerSock')
    .on('connection', function (socket) {
        powerClients[socket.id] = socket;
        console.log("Someone connected to /Power")
        //pastDataPower(dbFile);
        ductTape.on('pastDataPower', function(theData){
            console.log("emitting old data");
            socket.emit('init', {hours: hoursBk, oldData: theData});
        });

        ductTape.on('packet', function(type){
            socket.emit('info', dataPacket);
            console.log('emitted: ' + dataPacket.type);
        });
        socket.on('disconnect', function(){
            delete powerClients[socket.id]
        })
    });
    


// File logging stuff! 
// ---------------------------------------------------------------



// The lifeboat that's made out of ducttape
// -------------------------------------------------------------------
 
ductTape.on('packet', function(){
    for( inerds in dataPacket){
        if( (isNaN(dataPacket[inerds]))  ||
          (dataPacket[inerds] === null ) ||
          (dataPacket[inerds] === undefined) ) 
                delete dataPacket[inerds];
    }

    fs.appendFile(dbFile, (JSON.stringify(dataPacket) + '\n,\n'), function(){
        console.log("File was appened with: " + dataPacket);
        ductTape.emit('logFinished')
    })
});

ductTape.on('logFinished', function(){
    console.log('Finished writing to the log');
});
    /*
    fs.stat(dbFile, function(err, stats){
        if (stats.size > dbLimit){
            fs.renameSync(dbFile, 'arch_'+Date.now());
        }
    })
})
  */          

