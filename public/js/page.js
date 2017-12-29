var socket = io.connect('http://localhost:3000');

socket.on('feedback', function (data) {
    $('#feedback').append('<p>' + data + '</p>');
});

socket.on('screenStatus', function (data) {
    $('#feedback').html('<h2>' + data + '</h2>');
});

socket.on('particleAccountMessage', function (data) {
    $('#particleAccountConnection').append(data);
});

socket.on('particleAccountConnected', function (data) {
    clearParticleAccount();
    $('#particleAccountConnection').removeClass('alert-danger').addClass('alert-success');
});

socket.on('particleDeviceMessage', function (data) {
    $('#particleDeviceConnection').append(data);
});

socket.on('particleDeviceConnected', function (data) {
    clearParticleDevice();
    $('#particleDeviceConnection').removeClass('alert-danger').addClass('alert-success');
    enableButtons();
});

socket.on('particleEnableButtons', function (data) {
    enableButtons();
});

socket.on('particleDeviceMessageClear', function (data) {
    clearParticleDevice();
});

socket.on('particleDeviceEnableConnect', function (data) {
    ennableRetryDeviceConnection();
});

$('body').on('click', '.raise', function () {
        clearFeadback();
        socket.emit('raise');
        timer();
});

$('body').on('click', '.lower', function () {
        clearFeadback();
        socket.emit('lower');
        timer();
});

$('body').on('click', '.stop', function () {
        clearFeadback();
        socket.emit('stop');
        timer();
});

$('body').on('click', '.retryDeviceConnection', function () {
    $( this ).addClass('hide').removeClass('show');
    socket.emit('retryDeviceConnection');
});

var clearFeadback = function () {
    $('#feedback').html('');
}

var clearParticleAccount = function () {
    $('#particleAccountConnection').html('');
}

var clearParticleDevice = function () {
    $('#particleDeviceConnection').html('');
}

var enableButtons = function () {
    $('.raise, .lower, .stop').removeClass('hide').addClass('show');
}

var ennableRetryDeviceConnection = function () {
    $('.retryDeviceConnection').removeClass('hide').addClass('show');
}

var timer = function () {
    setTimeout(function () {
        $('#feedback').html('');
    }, 1 * 60 * 1000);
}
