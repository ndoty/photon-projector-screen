var express = require('express'),
    Particle = require('particle-api-js'),
    particle = new Particle(),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    fs = require('fs'),
    webUIConnected = false,
    stream,
    token;

app.set('view engine', 'jade');

app.set('title', "Photon Projector Screen Toggle");

server.listen(3000);

particle.login({username: 'n.faustdoty@gmail.com', password: 'Remember0812'}).then(
    function(data){
        logMessage('Particle Photon login success.')

        token = data.body.access_token;
    },
    function(err) {
        logMessage('Particle Photon login fail: ' + err);
    }
);

io.on('connection', function (socket) {
    logMessage("Web UI Connected");

    webUIConnected = true;

    stream = socket;

    socket.on('raise', function () {
        status = "raising";

        logMessage("Screen is currently " + status);

        raise(function (success) {
            if (success.body.return_value === '1') {
                socket.emit('status', 'Screen is currently raised');
            } else {
                socket.emit('status', 'Error Raising');
            }
        });
    });

    socket.on('lower', function () {
        status = "lowering";

        logMessage("Screen is currently " + status);

        lower(function (success) {
            if (success.body.return_value === '1') {
                socket.emit('status', 'Screen is currently lowered');
            } else {
                socket.emit('status', 'Error Lowering');
            }
        });
    });

    socket.on('stop', function () {
        status = "stopping";

        logMessage("Screen is currently " + status);

        stop(function (success) {
            if (success.body.return_value === '1') {
                socket.emit('status', 'Screen is currently stopped');
            } else {
                socket.emit('status', 'Error Stopping');
            }
        });
    });

    socket.on('disconnect', function (data) {
        webUIConnected = false;

        logMessage("Web UI Disconnected")
    });
});

app.use(express.static('public'));

app.use(express.static(__dirname + '/bower_components'));

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/raise', function (req, res) {
    raise();
});

app.get('/lower', function (req, res) {
    lower();
});

app.get('/stop', function (req, res) {
    stop();
});

function logMessage (message) {
    console.log(message);

    if (webUIConnected) {
        stream.emit('feedback', message);
    }
}

function raise (cb) {
    var fnRaise = particle.callFunction({ deviceId: '32003d000f47343432313031', name: 'screen', argument: 'raise', auth: token });

    fnRaise.then(
        function(data) {
            logMessage('Photon Function called succesfully');
            if (cb) cb(data);
        }, function(err) {
            if (cb) cb(data);
            logMessage('Photon Function call error: ' + err);
        }
    );
}

function lower () {
    var fnLower = particle.callFunction({ deviceId: '32003d000f47343432313031', name: 'screen', argument: 'lower', auth: token });

    fnLower.then(
        function(data) {
            logMessage('Photon Function called succesfully');
            if (cb) cb(data);
        }, function(err) {
            logMessage('Photon Function call error: ' + err);
            if (cb) cb(data);
        }
    );
}

function stop () {
    var fnLower = particle.callFunction({ deviceId: '32003d000f47343432313031', name: 'screen', argument: 'stop', auth: token });

    fnLower.then(
        function(data) {
            logMessage('Photon Function called succesfully');
            if (cb) cb(data);
        }, function(err) {
            logMessage('Photon Function call error: ' + err);
            if (cb) cb(data);
        }
    );
}

process.on('SIGINT', function () {
    if (webUIConnected) {
        stream.emit('feedback', "SERVER DOWN");
    }

    logMessage("\nCaught interrupt signal");

    logMessage("App Exited Safely");

    process.exit();
});

module.exports = app;