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
var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
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

function gt() {
    // Shamelessly picked from some other code!
    return (new Date()).getTime()-18000000;
}

// The boilerplate actually works right now. DON'T MODIFY ABOVE HERE!!!!
// --------------------------------------------------------------------




// Useful functions and the body will go right down here! 
// --------------------------------------------------------------------


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
            /* 
            else if(value === '\n'){
                //This is the end of that string. Ship that shit out?
            }

            else if(index > 8){
                return;
            }

            else if( (index < 8) && (dataPacket['type'] === 'voltage') ){
                dataPacket['board'+index] = parseFloat(value)
            }

            else if( (index === 1) && (dataPacket['type'] === 'current') ) {
                dataPacket['current'] = value;
                }

            else if( (index === 2) && (dataPacket['type'] === 'current') ){
                dataPacket['totVoltage'] = value;
            }
            */
        });

        console.log(dataPacket)
        dataPacket['time'] = Date.now();
        ductTape.emit('packet', dataPacket.type);
    });
});

serial.on('error', function(err){
    console.log('There was an error: ' + err);
    throw err;
});

// Sockets are right here!!! 

io.sockets.on('connection', function(socket){
    socket.emit('start', {hours: hoursBk} );

    ductTape.on('packet', function(type){
        socket.emit('info', dataPacket);
        console.log('emitted: ' + dataPacket.type);
    });
});


// File logging stuff! 
// ---------------------------------------------------------------


// The lifeboat that's made out of ducttape
// -------------------------------------------------------------------
 
ductTape.on('packet', function(){
    for( inerds in dataPacket){
        if(isNaN(dataPacket[inerds]) ) delete dataPacket[inerds];
    }

    fs.appendFile(dbFile, (JSON.stringify(dataPacket) + '\n'), function(){
        console.log("File was appened with:");
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

