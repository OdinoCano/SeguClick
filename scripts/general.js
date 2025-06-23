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

class ServiceWorkerDetector {
  constructor() {
    this.isServiceWorker = typeof importScripts === 'function';
    this.callbacks = new Map();
    this.testId = 0;
  }

  /**
   * Detecta si el contexto se cierra por inactividad del Service Worker
   * @param {Object} options - Configuración de la prueba
   * @param {number} options.timeout - Tiempo de espera en ms (default: 3000)
   * @param {boolean} options.multipleTests - Ejecutar múltiples pruebas (default: false)
   * @param {function} callback - Callback con resultado: (resultado, detalles)
   */
  detectarCierreContexto(options = {}, callback) {
    const config = {
      timeout: options.timeout || 3000,
      multipleTests: options.multipleTests || false,
      ...options
    };

    const testId = ++this.testId;
    const startTime = performance.now();
    
    console.log(`[SW Detector] Iniciando prueba ${testId}`);

    // Información del contexto actual
    const contextInfo = this.obtenerInfoContexto();
    
    if (!this.isServiceWorker) {
      // En content script o popup, usar método alternativo
      return this.detectarEnContentScript(config, callback, testId, startTime, contextInfo);
    }

    // Método principal para Service Workers
    this.probarSelectorArchivos(config, callback, testId, startTime, contextInfo);
  }

  probarSelectorArchivos(config, callback, testId, startTime, contextInfo) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*,audio/*"; // Más tipos para mejor detección
    input.multiple = true; // Permitir múltiples archivos
    input.style.cssText = "position:absolute;left:-9999px;opacity:0;pointer-events:none;";
    
    document.body.appendChild(input);

    let changeRecibido = false;
    let focusRecibido = false;
    let cleanupExecuted = false;

    const cleanup = () => {
      if (cleanupExecuted) return;
      cleanupExecuted = true;
      
      try {
        if (input.parentNode) {
          document.body.removeChild(input);
        }
      } catch (e) {
        console.warn('[SW Detector] Error en cleanup:', e);
      }
    };

    // Múltiples eventos para mejor detección
    const eventos = ['change', 'input', 'cancel'];
    eventos.forEach(evento => {
      input.addEventListener(evento, () => {
        if (evento === 'change' || evento === 'input') {
          changeRecibido = true;
        }
        
        const endTime = performance.now();
        const resultado = {
          contextoCerrado: false,
          tiempoRespuesta: endTime - startTime,
          evento: evento,
          archivosSeleccionados: input.files?.length || 0,
          testId,
          contexto: contextInfo
        };

        console.log(`[SW Detector] Prueba ${testId} exitosa:`, resultado);
        callback(resultado);
        cleanup();
      }, { once: true });
    });

    // Detectar cuando la ventana recupera el foco
    window.addEventListener('focus', () => {
      focusRecibido = true;
    }, { once: true });

    // Detectar visibilidad
    let visibilityChanged = false;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        visibilityChanged = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Intentar abrir el selector
    try {
      input.click();
      console.log(`[SW Detector] Selector activado para prueba ${testId}`);
    } catch (error) {
      const resultado = {
        contextoCerrado: true,
        error: 'Error al activar selector: ' + error.message,
        tiempoRespuesta: performance.now() - startTime,
        testId,
        contexto: contextInfo
      };
      callback(resultado);
      cleanup();
      return;
    }

    // Timeout con análisis detallado
    const timeoutId = setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      const endTime = performance.now();
      const tiempoTranscurrido = endTime - startTime;
      
      // Análisis del estado
      let motivo = 'Timeout - ';
      if (!focusRecibido && !visibilityChanged) {
        motivo += 'Contexto probablemente cerrado por Service Worker';
      } else if (focusRecibido || visibilityChanged) {
        motivo += 'Usuario canceló la selección';
      } else {
        motivo += 'Causa indeterminada';
      }

      const resultado = {
        contextoCerrado: !changeRecibido && !focusRecibido && !visibilityChanged,
        motivo,
        tiempoRespuesta: tiempoTranscurrido,
        focusRecibido,
        visibilityChanged,
        changeRecibido,
        testId,
        contexto: contextInfo,
        timeout: config.timeout
      };

      console.log(`[SW Detector] Prueba ${testId} completada por timeout:`, resultado);
      callback(resultado);
      cleanup();
    }, config.timeout);

    // Guardar referencia para cleanup manual si es necesario
    this.callbacks.set(testId, { cleanup, timeoutId });
  }

  detectarEnContentScript(config, callback, testId, startTime, contextInfo) {
    // Método alternativo para content scripts
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    
    setTimeout(() => {
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize || 0;
      
      const resultado = {
        contextoCerrado: false, // Content scripts no se cierran igual
        tipoContexto: 'content-script',
        tiempoRespuesta: endTime - startTime,
        memoriaInicial: startMemory,
        memoriaFinal: endMemory,
        diferenciMemoria: endMemory - startMemory,
        testId,
        contexto: contextInfo
      };

      callback(resultado);
    }, 100);
  }

  obtenerInfoContexto() {
    return {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: location.href,
      isServiceWorker: this.isServiceWorker,
      hasDocument: typeof document !== 'undefined',
      hasWindow: typeof window !== 'undefined',
      documentReady: document?.readyState,
      memoria: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  // Ejecutar múltiples pruebas para mayor precisión
  ejecutarPruebasMultiples(cantidad = 3, intervalo = 1000, callback) {
    const resultados = [];
    let pruebasCompletadas = 0;

    const ejecutarPrueba = (index) => {
      this.detectarCierreContexto({}, (resultado) => {
        resultados.push({ ...resultado, pruebaIndex: index });
        pruebasCompletadas++;

        if (pruebasCompletadas === cantidad) {
          const analisis = this.analizarResultadosMultiples(resultados);
          callback(analisis);
        } else if (pruebasCompletadas < cantidad) {
          setTimeout(() => ejecutarPrueba(pruebasCompletadas), intervalo);
        }
      });
    };

    ejecutarPrueba(0);
  }

  analizarResultadosMultiples(resultados) {
    const cierresProbables = resultados.filter(r => r.contextoCerrado).length;
    const tiempoPromedio = resultados.reduce((sum, r) => sum + r.tiempoRespuesta, 0) / resultados.length;
    
    return {
      totalPruebas: resultados.length,
      cierresProbables,
      porcentajeCierres: (cierresProbables / resultados.length) * 100,
      tiempoPromedioRespuesta: tiempoPromedio,
      conclusión: cierresProbables > resultados.length / 2 ? 
        'Service Worker probablemente se cierra por inactividad' : 
        'Service Worker parece estable',
      resultadosDetallados: resultados
    };
  }

  // Método de conveniencia
  static probar(opciones = {}, callback) {
    const detector = new ServiceWorkerDetector();
    
    if (opciones.multiple) {
      detector.ejecutarPruebasMultiples(
        opciones.cantidad || 3,
        opciones.intervalo || 1000,
        callback
      );
    } else {
      detector.detectarCierreContexto(opciones, callback);
    }
  }
}

// Uso simple (mantiene compatibilidad con tu función original)
function probarSelectorArchivos(callback) {
  ServiceWorkerDetector.probar({}, (resultado) => {
    callback(!resultado.contextoCerrado);
  });
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceWorkerDetector;
}
