const ALERT_TYPES = new Set(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']);

function message(type, msg, time) {
  if (!ALERT_TYPES.has(type)) type = 'primary';
  
  const $message = $('#message');
  $message.find(':not(.btn-close)').remove();
  $message.removeClass([...ALERT_TYPES].map(t => `alert-${t}`).join(' '));
  $message.addClass(`alert-${type}`).text(msg).show();
  
  setTimeout(() => $message.fadeOut(), time);
}

// Funciones de internacionalización optimizadas
const i18nUtils = {
  setText(id) {
    const text = chrome.i18n.getMessage(id);
    if (text) $(`#${id}`).append(text);
  },

  getText(id) {
    return chrome.i18n.getMessage(id);
  },

  setTextById(id, messageKey) {
    const text = chrome.i18n.getMessage(messageKey);
    if (!text) {
      console.warn(`No translation found for message key: ${messageKey}`);
      return;
    }
    $(`#${id}`).append(text);
  },

  setTextByClass(className) {
    const text = chrome.i18n.getMessage(className);
    if (text) $(`.${className}`).each(function() {
      $(this).append(text);
    });
  },

  setInputPlaceholderByClass(labelClass, messageKey) {
    const text = chrome.i18n.getMessage(messageKey);
    if (!text) return;
    
    $(`.${labelClass}`).each(function() {
      const inputId = $(this).attr('for');
      if (inputId) $(`#${inputId}`).attr('placeholder', text);
    });
  },

  setFirstOptionText(selectId, messageKey) {
    const text = chrome.i18n.getMessage(messageKey);
    if (!text) return;
    
    const $firstOption = $(`#${selectId} option:first`);
    if ($firstOption.length) $firstOption.append(text);
  },

  setInputPlaceholder(labelId, messageKey) {
    const $label = $(`#${labelId}`);
    const inputId = $label.attr('for');
    if (inputId) {
      $(`#${inputId}`).attr('placeholder', chrome.i18n.getMessage(messageKey));
    }
  },

  setSelectPlaceholder(selectId, messageKey) {
    $(`#${selectId}`).attr('placeholder', chrome.i18n.getMessage(messageKey));
  }
};

// Mantener funciones globales para compatibilidad
const { setText, getText, setTextById, setTextByClass, setInputPlaceholderByClass, 
        setFirstOptionText, setInputPlaceholder, setSelectPlaceholder } = i18nUtils;

// Función optimizada para convertir URL a Data URL
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
    this.isTestingInProgress = false;
    this.timeouts = new Set();
  }

  mantenerContextoActivo() {
    if (this.isServiceWorker && !this.keepAlivePort) {
      this.keepAlivePort = chrome.runtime.connect({ name: "context-keepalive" });
      this.keepAlivePort.onDisconnect.addListener(() => {
        this.keepAlivePort = null;
      });
    }
  }

  clearTimeouts() {
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();
  }

  addTimeout(callback, delay) {
    const id = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  async detectarPerdidaContexto(callback) {
    if (this.isTestingInProgress) {
      callback(false, { motivo: "Prueba ya en progreso", testId: this.testId });
      return;
    }

    this.isTestingInProgress = true;
    this.mantenerContextoActivo();
    const testId = ++this.testId;
    const startTime = performance.now();

    // Verificaciones iniciales
    if (typeof document === 'undefined' || !document.body) {
      this.isTestingInProgress = false;
      callback(true, { motivo: "Sin documento o body", testId });
      return;
    }

    // Prueba de manipulación DOM
    try {
      const testDiv = document.createElement("div");
      document.body.appendChild(testDiv);
      document.body.removeChild(testDiv);
    } catch (error) {
      this.isTestingInProgress = false;
      callback(true, { motivo: "No se puede manipular DOM", error: error.message, testId });
      return;
    }

    await this.waitForUserInteraction();
    this.performFileSelectionTest(callback, testId, startTime);
  }

  async performFileSelectionTest(callback, testId, startTime) {
    const input = document.createElement("input");
    input.type = "file";
    input.style.cssText = "position:absolute;left:-9999px;opacity:0;pointer-events:none;width:1px;height:1px;";
    
    let eventoRecibido = false;
    let userInteracted = false;
    let blurDetected = false;

    const finalizar = (perdido, detalles = {}) => {
      if (eventoRecibido) return;
      eventoRecibido = true;
      this.isTestingInProgress = false;
      
      this.clearTimeouts();
      this.removeEventListeners();
      this.cleanupInput(input);
      
      callback(perdido, {
        ...detalles,
        testId,
        tiempo: performance.now() - startTime
      });
    };

    const handlers = {
      blur: () => {
        blurDetected = true;
        this.addTimeout(() => {
          if (!userInteracted && !eventoRecibido) {
            finalizar(false, {evento: 'user_cancelled', blur: true});
          }
        }, 500);
      },

      focus: () => {
        if (blurDetected && !userInteracted) {
          this.addTimeout(() => {
            if (!userInteracted && !eventoRecibido) {
              finalizar(false, {evento: 'focus_return_cancel'});
            }
          }, 100);
        }
      },

      change: (e) => {
        userInteracted = true;
        finalizar(false, {evento: 'change', files: e.target.files.length});
      },

      cancel: () => {
        userInteracted = true;
        finalizar(false, {evento: 'cancel_event'});
      }
    };

    // Configurar event listeners
    window.addEventListener('blur', handlers.blur);
    window.addEventListener('focus', handlers.focus);
    input.addEventListener('change', handlers.change, {once: true});
    input.addEventListener('cancel', handlers.cancel, {once: true});

    // Timeout principal
    this.addTimeout(() => {
      const visible = document.visibilityState === 'visible';
      const hasBody = !!document.body;
      
      if (!hasBody || document.visibilityState === 'hidden') {
        finalizar(true, {
          motivo: "Contexto realmente perdido",
          visibilityState: document.visibilityState,
          hasBody
        });
      } else {
        finalizar(false, {
          motivo: "Timeout pero contexto aparentemente funcional",
          visibilityState: document.visibilityState
        });
      }
    }, 5000);

    // Ejecutar prueba
    try {
      document.body.appendChild(input);
      input.click();
    } catch (error) {
      finalizar(true, { motivo: "Error al abrir selector", error: error.message });
    }
  }

  removeEventListeners() {
    // Los event listeners se limpian automáticamente con {once: true} o en finalizar()
  }

  cleanupInput(input) {
    try {
      if (input.parentNode) {
        document.body.removeChild(input);
      }
    } catch (e) {
      console.warn("Error removiendo input:", e);
    }
  }

  waitForUserInteraction() {
    return new Promise((resolve) => {
      const handleInteraction = () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        resolve();
      };

      document.addEventListener('click', handleInteraction, { once: true });
      document.addEventListener('keydown', handleInteraction, { once: true });
    });
  }
}

function probarSelectorArchivos(callback) {
  const detector = new UniversalContextDetector();
  
  detector.detectarPerdidaContexto((perdido, detalles) => {
    console.log(`🔍 Prueba contexto: ${perdido ? "❌ PERDIDO" : "✅ FUNCIONAL"}`, detalles);
    
    const realmentePerdido = perdido && (
      detalles.motivo.includes("Sin documento") ||
      detalles.motivo.includes("manipular DOM") ||
      detalles.motivo.includes("Error al") ||
      detalles.visibilityState === 'hidden'
    );
    
    callback(!realmentePerdido);
  });
}