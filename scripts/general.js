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
    this.isTestingInProgress = false; // Evitar múltiples pruebas simultáneas
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
    // Evitar múltiples pruebas simultáneas
    if (this.isTestingInProgress) {
      callback(false, { motivo: "Prueba ya en progreso", testId: this.testId });
      return;
    }

    this.isTestingInProgress = true;
    this.mantenerContextoActivo();
    const testId = ++this.testId;
    const startTime = performance.now();
    
    // Si no hay documento, definitivamente hay problema
    if (typeof document === 'undefined' || !document.body) {
      this.isTestingInProgress = false;
      callback(true, {motivo: "Sin documento o body", testId});
      return;
    }

    // Verificar si ya perdimos el contexto básico
    try {
      const testDiv = document.createElement("div");
      document.body.appendChild(testDiv);
      document.body.removeChild(testDiv);
    } catch (error) {
      this.isTestingInProgress = false;
      callback(true, {motivo: "No se puede manipular DOM", error: error.message, testId});
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.style.cssText = "position:absolute;left:-9999px;opacity:0;pointer-events:none;width:1px;height:1px;";
    
    let eventoRecibido = false;
    let timeoutId;
    let interactionTimeout;

    const finalizar = (perdido, detalles = {}) => {
      if (eventoRecibido) return;
      eventoRecibido = true;
      this.isTestingInProgress = false;
      
      clearTimeout(timeoutId);
      clearTimeout(interactionTimeout);
      
      // Limpiar event listeners
      window.removeEventListener('blur', blurHandler);
      window.removeEventListener('focus', focusHandler);
      
      try {
        if (input.parentNode) {
          document.body.removeChild(input);
        }
      } catch (e) {
        console.warn("Error removiendo input:", e);
      }
      
      callback(perdido, {
        ...detalles,
        testId,
        tiempo: performance.now() - startTime
      });
    };

    let userInteracted = false;
    let blurDetected = false;

    // Detectar interacción del usuario
    const blurHandler = () => {
      blurDetected = true;
      // Dar tiempo para que aparezca el diálogo
      interactionTimeout = setTimeout(() => {
        if (!userInteracted && !eventoRecibido) {
          // Si hay blur pero no hay cambio en el input, el usuario canceló
          finalizar(false, {evento: 'user_cancelled', blur: true});
        }
      }, 500); // Tiempo más generoso para la interacción
    };

    const focusHandler = () => {
      if (blurDetected && !userInteracted) {
        // Usuario regresó sin seleccionar archivo = cancelación
        setTimeout(() => {
          if (!userInteracted && !eventoRecibido) {
            finalizar(false, {evento: 'focus_return_cancel'});
          }
        }, 100);
      }
    };

    // Eventos de éxito - usuario seleccionó archivo
    input.addEventListener('change', (e) => {
      userInteracted = true;
      finalizar(false, {evento: 'change', files: e.target.files.length});
    }, {once: true});

    // Detectar cancelación por otros medios
    input.addEventListener('cancel', () => {
      userInteracted = true;
      finalizar(false, {evento: 'cancel_event'});
    }, {once: true});

    window.addEventListener('blur', blurHandler);
    window.addEventListener('focus', focusHandler);

    // Timeout más largo para dar tiempo real al usuario
    timeoutId = setTimeout(() => {
      const visible = document.visibilityState === 'visible';
      const hasBody = !!document.body;
      
      // Solo considerar contexto perdido si hay evidencia real
      if (!hasBody || document.visibilityState === 'hidden') {
        finalizar(true, {
          motivo: "Contexto realmente perdido",
          visibilityState: document.visibilityState,
          hasBody
        });
      } else {
        // Si el documento sigue visible y funcional, probablemente el usuario solo tardó
        finalizar(false, {
          motivo: "Timeout pero contexto aparentemente funcional",
          visibilityState: document.visibilityState
        });
      }
    }, 5000); // Timeout más generoso

    // Agregar el input al DOM antes de hacer click
    try {
      document.body.appendChild(input);
      
      // Pequeña pausa para asegurar que el elemento esté en el DOM
      setTimeout(() => {
        try {
          input.click();
        } catch (error) {
          finalizar(true, {motivo: "Error al abrir selector", error: error.message});
        }
      }, 50);
      
    } catch (error) {
      finalizar(true, {motivo: "Error agregando input al DOM", error: error.message});
    }
  }
}

// Función optimizada con mejor lógica
function probarSelectorArchivos(callback) {
  const detector = new UniversalContextDetector();
  
  detector.detectarPerdidaContexto((perdido, detalles) => {
    console.log(`🔍 Prueba contexto: ${perdido ? "❌ PERDIDO" : "✅ FUNCIONAL"}`, detalles);
    
    // Solo reportar contexto perdido si hay evidencia real
    const realmentePerdido = perdido && (
      detalles.motivo.includes("Sin documento") ||
      detalles.motivo.includes("manipular DOM") ||
      detalles.motivo.includes("Error al") ||
      detalles.visibilityState === 'hidden'
    );
    
    callback(!realmentePerdido);
  });
}