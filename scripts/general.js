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

function setText(id){
    let text = chrome.i18n.getMessage(id)
    $("#"+id).append(text)
}

function setTextById(id, messageKey) {
    let text = chrome.i18n.getMessage(messageKey);
    if (!text) {
        console.warn(`No translation found for message key: ${messageKey}`);
        return;
    }
    $("#"+id).append(text)
}

const setFirstOptionText = (selectId, messageKey) => {
    let text = chrome.i18n.getMessage(messageKey);
    const $select = $('#' + selectId);
    if ($select.length && $select.find('option').length > 0) {
        $select.find('option').first().append(text);
    }
};

const setInputPlaceholder = (labelId, messageKey) => {
  const $label = $('#' + labelId);
  const inputId = $label.attr('for');
  $("#" + inputId).attr('placeholder', chrome.i18n.getMessage(messageKey));
};


const setSelectPlaceholder = (selectId, messageKey) => {
    const $select = $('#' + selectId);
    $select.attr('placeholder', chrome.i18n.getMessage(messageKey));
}