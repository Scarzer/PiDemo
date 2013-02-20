var util = require('util');
var EventEmitter = require('events').EventEmitter;

var arduinoStream = function(theArray){
    
    var self = this;

    // datapacket
    process.nextTick(function(){
        self.emit('created')
    });

    




