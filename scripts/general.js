function message(type, msg, time) {
    let validTypes = ['primary','secondary','success','danger','warning','info','light','dark'];
    if ($.inArray(type, validTypes) === -1) type = 'primary';
    let $message = $('#message');
    $message.find(':not(.btn-close)').remove();
    $message.removeClass('alert-primary alert-secondary alert-success alert-danger alert-warning alert-info alert-light alert-dark');
    $message.addClass('alert-' + type);
    $message.text(msg).show();
    setTimeout(function() {
        $message.fadeOut();
    }, time);
}

function getLanguage(){}

function getText(){}