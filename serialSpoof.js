var serialport = require('serialport')
var SerialPort = serialport.SerialPort;

var sp = new SerialPort("/dev/pts/3", {
    baudrate : 115200
})


sp.on('open', function(){
    var foo = setInterval(function(){
        sp.write('V' + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + '\n')
        console.log('sent voltage');
        },1000);

    var baz = setInterval(function(){
        sp.write('C' + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + (Math.random() * 3) + ',' + '\n')
        console.log('sent current');
        },1000);
})

sp.on('data', function(data){
    console.log('got data: ' + data.toString());
});
