cmd_Release/obj.target/serialport.node := flock ./Release/linker.lock g++ -shared -pthread -rdynamic -m64  -Wl,-soname=serialport.node -o Release/obj.target/serialport.node -Wl,--start-group Release/obj.target/serialport/src/serialport.o Release/obj.target/serialport/src/serialport_unix.o -Wl,--end-group 