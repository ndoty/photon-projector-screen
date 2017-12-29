var nconf = require('nconf'),
    express = require('express'),
    Particle = require('particle-api-js'),
    particle = new Particle(),
    particleTocken,
    particleConnected = false,
    particleConnectionErr,
    particleDeviceConnected = false,
    particleDeviceConnectionErr,
    particleDeviceConnectionTryCount = 0,
    particleDeviceName,
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    fs = require('fs'),
    webUIConnected = false,
    stream,
    token,
    logCount = 0,
    particleConfig = {};

nconf.file({ file: 'particleConfig.json' });

particleConfig = nconf.get('particleConfig');

app.set('view engine', 'jade');

app.set('title', "Photon Projector Screen Toggle");

server.listen(3000);

io.on('connection', function (socket) {
    webUIConnected = true;

    stream = socket;

    console.log("Web UI Connected");

    socket.emit('serverUp');

    if (particleConnected) {
        stream.emit('particleDisableAccountConnect');
        stream.emit('particleAccountConnected');
        stream.emit('particleAccountMessage', 'Particle account login for ' + particleConfig.username + ' successful.');
    } else {
        stream.emit('particleEnableAccountConnect');
    }

    if (particleDeviceConnected) {
        stream.emit('particleDeviceConnected');
        stream.emit('particleDeviceMessage', 'Particle Device ' + particleDeviceName + ' with id ' + particleConfig.deviceID + ' is connected.');
        getStatus();
    } else {
        stream.emit('particleDeviceEnableConnect');
    }

    socket.on('raise', function () {
        if ( particleDeviceConnected) {
            raise(function (data) {
                if (data.body.return_value !== 1) {
                    stream.emit('feedback', 'Device Function Error with raise');
                }
            });
        }
    });

    socket.on('lower', function () {
        if ( particleDeviceConnected) {
            lower(function (data) {
                if (data.body.return_value !== 1) {
                    stream.emit('feedback', 'Device Function Error with lower');
                }
            });
        }
    });

    socket.on('stop', function () {
        if ( particleDeviceConnected) {
            stop(function (data) {
                if (data.body.return_value !== 1) {
                    stream.emit('feedback', 'Device Function Error stop');
                }
            });
        }
    });

    socket.on('disconnect', function (data) {
        webUIConnected = false;

        console.log("Web UI Disconnected")
    });

    socket.on('retryDeviceConnection', function (data) {
        particleDeviceConnectionTryCount = 0;
        connectParticleDevice();
    });
});

app.use(express.static('public'));

app.use(express.static(__dirname + '/bower_components'));

app.get('/', function (req, res) {
    res.render('index', {data: {particleConfig}});
});

app.get('/raise', function (req, res) {
    if ( particleDeviceConnected ) {        
        raise(function (data) {
            if (data.body.return_value === '1') {
                stream.emit('feedback', 'Screen is currently raised');
            } else {
                stream.emit('feedback', 'Error Raising');
            }
        });
    }
    res.render('index', {data: {particleConfig}});
});

app.get('/lower', function (req, res) {
    if ( particleDeviceConnected ) {        
        lower(function (data) {
            if (data.body.return_value === '1') {
                stream.emit('feedback', 'Screen is currently lowered');
            } else {
                stream.emit('feedback', 'Error Lowering');
            }
        });
    }
    res.render('index', {data: {particleConfig}});
});

app.get('/stop', function (req, res) {
    if ( particleDeviceConnected ) {        
        stop(function (data) {
            if (data.body.return_value === '1') {
                stream.emit('feedback', 'Screen is currently stopped');
            } else {
                stream.emit('feedback', 'Error Stopping');
            }
        });
    }
    res.render('index', {data: {particleConfig}});
});

function logMessage (message, socket) {
    console.log(message);

    if (webUIConnected) {
        stream.emit(socket, message);
    }
}

function getParticleEventStream (cb) {
    particle.getEventStream({ deviceId: particleConfig.deviceID, auth: particleToken }).then(function(particleStream) {
        particleStream.on('event', function(streamData) {
            logMessage(streamData.name.replace(/\_/g, ' '), streamData.data);
            
            if (cb) cb();
        });
    });
}

function connectParticleAccount (cb) {
    var message = 'Logging into particle account for ' + particleConfig.username + '.';
    
    console.log(message);

    if (webUIConnected) stream.emit('particleAccountMessage', message);

    particle.login({username: particleConfig.username, password: particleConfig.password}).then(
        function(data){
            var message = 'Particle account login for ' + particleConfig.username + ' successful.'

            console.log( message );

            if (webUIConnected) {
                stream.emit('particleAccountConnected');
                stream.emit('particleAccountMessage', message);
            }

            particleToken = data.body.access_token;

            particleConnected = true;

            if (cb) cb();

        },
        function(err) {

            var message = 'Particle login for ' + particleConfig.username + ' failed with error: ' + err;
            
            console.log( message );

            if (webUIConnected) stream.emit('particleAccountMessage', message);
            
            if (cb) cb();
        }
    );
}

function connectParticleDevice (cb) {
    var message = 'Checking if Particle Device with ID ' + particleConfig.deviceID + ' is connected.';

    console.log( message );


    if (webUIConnected) {
        stream.emit('particleDeviceMessageClear');
        stream.emit('particleDeviceMessage', message);
    }

    particle.getDevice({ deviceId: particleConfig.deviceID, auth: particleToken }).then(
        function(data){
            particleDeviceConnectionTryCount++;

            particleDeviceConnected = data.body.connected;

            particleDeviceName = data.body.name;

            if ( particleDeviceConnected ) {
                var message = 'Particle Device ' + particleDeviceName + ' with id ' + particleConfig.deviceID + ' is connected.';

                console.log( message );

                if (webUIConnected) {
                    stream.emit('particleAccountConnected');
                    stream.emit('particleDeviceMessage', message);
                }
            } else {
                var message = '<br />Unable to connect to Particle Device ' + particleConfig.deviceID 
                + '.<br />Is the device on and connected to the internet?';

                var tempMessage = message.replace(/\<br \/\>/g, "");

                console.log( tempMessage );

                if (webUIConnected) stream.emit('particleDeviceMessage', message);
                
                if (particleDeviceConnectionTryCount <= 5) {
                    var message = '<br />This was connection attempt ' + particleDeviceConnectionTryCount + 
                         '.<br /> Retrying connection automatically in 5 minutes.';

                    var tempMessage = message.replace(/\<br \/\>/g, "");
                    
                    console.log( tempMessage );
                    
                    if (webUIConnected) stream.emit('particleDeviceMessage', message);
                    
                    setTimeout(function () {
                        connectParticleDevice();
                    }, 5 * 60 * 1000);
                } else {
                    var message = '<br />Device connection for ' + particleConfig.deviceID + 
                        ' has exceeded 5 times. Not trying to connect anymore.<br />' +
                        ' Please ensure the device is connected to the internet' +
                        ' or you supplied the correct device ID (' + particleConfig.deviceID + ').' +
                        ' <br />A button to retry the connection will appear in approximately 1 minute.';

                    var tempMessage = message.replace("<br /", "")
                    
                    console.log( tempMessage );
                    
                    if (webUIConnected) {
                        stream.emit('particleDeviceMessage', message);
                    }

                    setTimeout(function () {
                        stream.emit('particleDeviceMessageClear');
                        stream.emit('particleDeviceMessage', 'Particle Device ' + particleConfig.deviceID + ' not connected.');
                        stream.emit('particleDeviceEnableConnect');
                    }, 1 * 60 * 1000);
                }
            }

            if (cb) cb();
        },
        function(err) {
            var message = 'Particle Device error for device ' + particleConfig.deviceID + ': ' + err;
            
            console.log( message );

            if (webUIConnected) stream.emit('particleAccountMessage', message);
            
            if (cb) cb();
        }
    );
}

function getStatus (cb) {
    var fnRaise = particle.callFunction({ deviceId: particleConfig.deviceID, name: particleConfig.deviceFunction, argument: 'getStatus', auth: particleToken });

        fnRaise.then(
            function(data) {
                if (cb) cb(data);
                return data.body.return_value;
            }, function(err) {
                logMessage('feedback', 'Photon Function error: ' + err);
                if (cb) cb(data);
            }
        );
}

function raise (cb) {
    if ( particleDeviceConnected) {
        var fnRaise = particle.callFunction({ deviceId: particleConfig.deviceID, name: particleConfig.deviceFunction, argument: 'raise', auth: particleToken });

        fnRaise.then(
            function(data) {
                if (cb) cb(data);
                return data.body.return_value;
            }, function(err) {
                logMessage('feedback', 'Photon Function error: ' + err);
                if (cb) cb(data);
            }
        );
    }
}

function lower (cb) {
    if ( particleDeviceConnected) {
        var fnLower = particle.callFunction({ deviceId: particleConfig.deviceID, name: particleConfig.deviceFunction, argument: 'lower', auth: particleToken });

        fnLower.then(
            function(data) {
                if (cb) cb(data);
                return data.body.return_value;
            }, function(err) {
                logMessage('feedback', 'Photon Function error: ' + err);
                if (cb) cb(data);
            }
        );
    }
}

function stop (cb) {
    if ( particleDeviceConnected) {
        var fnLower = particle.callFunction({ deviceId: particleConfig.deviceID, name: particleConfig.deviceFunction, argument: 'stop', auth: particleToken });

        fnLower.then(
            function(data) {
                if (cb) cb(data);
                return data.body.return_value;
            }, function(err) {
                logMessage('feedback', 'Photon Function error: ' + err);
                if (cb) cb(data);
            }
        );
    }
}

connectParticleAccount(function () {
    if (particleConnected) {
        connectParticleDevice(function () {
            getParticleEventStream();
        });
    }
});

process.on('SIGINT', function () {
    if (webUIConnected) {
        stream.emit('serverDown', "SERVER DOWN");
    }

    logMessage('feedback', "\nCaught interrupt signal");

    logMessage('feedback', "App Exited Safely");

    process.exit();
});

module.exports = app;