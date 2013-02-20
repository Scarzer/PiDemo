var config = {
    port : '/dev/ttyACM0',
    serial : { /* settings of the serial port */
        baudrate : 115200,
    },

    logFile : 'loggedData.js', /* Where you will log the data */
    hoursBack : 2 /* Number of hours you want logged */
}

module.exports = config;
