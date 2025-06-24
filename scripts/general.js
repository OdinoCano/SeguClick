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

class UniversalContextDetector {
  constructor() {
    this.isServiceWorker = typeof importScripts === 'function';
    this.testId = 0;
    this.keepAlivePort = null;
  }

  mantenerContextoActivo() {
    if (this.isServiceWorker && !this.keepAlivePort) {
      this.keepAlivePort = chrome.runtime.connect({ name: "context-keepalive" });
      this.keepAlivePort.onDisconnect.addListener(() => {
        this.keepAlivePort = null;
      });
    }
  }

  detectarPerdidaContexto(callback) {
    this.mantenerContextoActivo();
    const testId = ++this.testId;
    const startTime = performance.now();
    
    if (typeof document === 'undefined') {
      callback(true, {motivo: "Sin documento", testId});
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.style.cssText = "position:absolute;left:-9999px;opacity:0;pointer-events:none;";
    document.body.appendChild(input);

    let eventoRecibido = false;
    let timeoutId;

    const finalizar = (perdido, detalles = {}) => {
      if (eventoRecibido) return;
      eventoRecibido = true;
      
      clearTimeout(timeoutId);
      try {
        document.body.removeChild(input);
      } catch (e) {}
      
      if (this.keepAlivePort) {
        this.keepAlivePort.disconnect();
        this.keepAlivePort = null;
      }
      
      callback(perdido, {
        ...detalles,
        testId,
        tiempo: performance.now() - startTime
      });
    };

    // Eventos de éxito
    input.addEventListener('change', () => finalizar(false, {evento: 'change'}), {once: true});
    
    // Detectar cancelación (universal)
    const cancelHandler = () => setTimeout(() => {
      if (!eventoRecibido) finalizar(false, {evento: 'cancel'});
    }, 300);
    
    window.addEventListener('blur', cancelHandler, {once: true});
    window.addEventListener('focus', cancelHandler, {once: true});

    // Timeout para pérdida de contexto
    timeoutId = setTimeout(() => {
      const visible = document.visibilityState === 'visible';
      finalizar(true, {
        motivo: visible ? "Timeout con documento visible" : "Contexto cerrado",
        visibilityState: document.visibilityState
      });
    }, 1000); // 3s es suficiente para sistemas rápidos

    // Intentar abrir selector
    try {
      input.click();
    } catch (error) {
      finalizar(true, {motivo: "Error al abrir selector", error: error.message});
    }
  }
}

// Función optimizada para tu caso de uso
function probarSelectorArchivos(callback) {
  const detector = new UniversalContextDetector();
  
  detector.detectarPerdidaContexto((perdido, detalles) => {
    console.log(`Resultado prueba: ${perdido ? "CONTEXTO PERDIDO" : "Éxito"}`, detalles);
    callback(!perdido);
  });
}
