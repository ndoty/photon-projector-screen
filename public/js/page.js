var socket = io.connect('http://localhost:3000');

socket.on('feedback', function (data) {
    $('#feedback').append('<p>' + data + '</p>');
});

socket.on('status', function (data) {
    $('#feedback').append('<h2>' + data + '</h2>');
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

var clearFeadback = function () {
    $('#feedback').html('');
}

var timer = function () {
    setTimeout(function () {
        $('#feedback').html('');
    }, 30000);
}
