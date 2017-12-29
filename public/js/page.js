var socket = io.connect();

//Socket Handlers
socket.on('particleAccountConnected', function (data) {
    particleDisableAccountConnect();
    clearParticleAccount();
    $('#particleAccountConnection').removeClass('alert-danger').addClass('alert-success');
});

socket.on('particleEnableAccountConnect', function (data) {
    particleEnableAccountConnect();
});

socket.on('particleAccountMessage', function (data) {
    $('#particleAccountConnection').append(data);
});

socket.on('particleDeviceConnected', function (data) {
    clearParticleDevice();
    $('#particleDeviceConnection').removeClass('alert-danger').addClass('alert-success');
    enableButtons();
});

socket.on('particleDeviceEnableConnect', function (data) {
    ennableRetryDeviceConnection();
});

socket.on('particleDeviceMessage', function (data) {
    $('#particleDeviceConnection').append(data);
});

socket.on('particleDeviceMessageClear', function (data) {
    clearParticleDevice();
});

socket.on('status', function (data) {
    $('#status').html('<h1>' + data + '</h1>');
    toggleDisplay("show", $('#status'));
});

socket.on('feedback', function (data) {
    $('#feedback').append('<p>' + data + '</p>');
    toggleDisplay("show", $('#feedback'));
});

socket.on('particleFeedbackClear', function (data) {
    clearFeadback();
});

socket.on('serverDown', function (data) {
    $('#serverDown').html('<h1>' + data + '</h1>')
    toggleDisplay("show", $('#serverDown'));
});

socket.on('serverUp', function (data) {
    toggleDisplay("hide", $('#serverDown'));
    $('#serverDown').html('');
});


//Click handlers
$('body').on('click', '.raise', function () {
        clearFeadback();
        socket.emit('raise');
});

$('body').on('click', '.lower', function () {
        clearFeadback();
        socket.emit('lower');
});

$('body').on('click', '.stop', function () {
        clearFeadback();
        socket.emit('stop');
});

$('body').on('click', '.retryDeviceConnection', function () {
    toggleDisplay("hide", $( this ));
    socket.emit('retryDeviceConnection');
});


//Functions
var toggleDisplay = function (action, $this) {
    if ( action === "hide" && $this.hasClass('show') ) {
        $this.removeClass('show').addClass('hide');
    } else if ( action === "show" && $this.hasClass('hide') ) {
        $this.removeClass('hide').addClass('show');
    }
}

var clearFeadback = function () {
    toggleDisplay('hide', $('#feedback'));
    $('#feedback').html('');
}

var clearParticleAccount = function () {
    $('#particleAccountConnection').html('');
}

var clearParticleDevice = function () {
    $('#particleDeviceConnection').html('');
}

var enableButtons = function () {
    toggleDisplay("show",  $('.raise, .lower, .stop'));
}

var particleEnableAccountConnect = function () {
    toggleDisplay("show",  $('.retryAccountConnection'));
}

var particleDisableAccountConnect = function () {
    toggleDisplay("hide",  $('.retryAccountConnection'));
}

var ennableRetryDeviceConnection = function () {
    toggleDisplay("show", $('.retryDeviceConnection'));
}
