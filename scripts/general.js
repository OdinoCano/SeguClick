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

function getText(id){
  return chrome.i18n.getMessage(id)
}

function setTextById(id, messageKey) {
  let text = chrome.i18n.getMessage(messageKey);
  if (!text) {
    console.warn(`No translation found for message key: ${messageKey}`);
    return;
  }
  $("#"+id).append(text)
}

function setTextByClass(className) {
  let text = chrome.i18n.getMessage(className);
  $("." + className).each(function() {
    $(this).append(text);
  });
}

const setInputPlaceholderByClass = (labelClass, messageKey) => {
  $('.' + labelClass).each(function() {
    const inputId = $(this).attr('for');
    if (inputId) {
      $("#" + inputId).attr('placeholder', chrome.i18n.getMessage(messageKey));
    }
  });
};

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

async function toDataURL(url, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`No se pudo cargar la imagen (${response.status} ${response.statusText})`);
    }

    const contentType = response.headers.get("Content-Type");

    if (!allowedTypes.includes(contentType)) {
      throw new Error(`Tipo de imagen no soportado: ${contentType}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Error al convertir la imagen a base64"));
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error("toDataURL error:", error);
    throw error;
  }
}