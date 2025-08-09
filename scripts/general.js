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

// Función simple para casos específicos conocidos
function verificarSiNecesitaVentana() {
  const ua = navigator.userAgent;
  const manifest = chrome?.runtime?.getManifest?.() || {};
  const manifestVersion = manifest.manifest_version || 2;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  // Patrones problemáticos por navegador y SO
  const problematicPatterns = [
    // Chrome en Mac (ej: Chrome 100+)
    /Mac OS X.*Chrome\/1\d{2,}/,

    // Chrome en Linux
    /Linux.*Chrome/,

    // Chrome en Mac con versiones específicas 120-125
    /Chrome\/12[0-5].*Mac/,

    // Safari versiones antiguas o en iOS (puedes ajustar si quieres)
    /Version\/.*Safari/,

    // Firefox en Windows/Mac/Linux (ejemplo de patrón, ajustar si es necesario)
    /Firefox\/(8[0-9]|9[0-9]|[1-9][0-9]{2,})/,

    // Edge basado en Chromium
    /Edg\/\d+/,

    // Opera (Chromium-based)
    /OPR\/\d+/
  ];

  // Detectar si User Agent es problemático
  const isProblematicUA = problematicPatterns.some(pattern => pattern.test(ua));

  if (isProblematicUA && manifestVersion === 3) return true; // Problema conocido en MV3
  if (isProblematicUA && hardwareConcurrency <= 2) return true; // Recursos limitados

  return isProblematicUA; // Default: basarse en UA
}