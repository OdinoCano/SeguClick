$(document).ready(async function () {
  // Configuración y constantes
  const CONFIG = {
    SCRIPTS: [
      "/scripts/bootstrap.bundle.5.3.6.min.js",
      "/scripts/lottie-web.5.13.0.min.js",
      "/scripts/menu.js"
    ],
    MONTHS: [
      { value: '01', name: 'Enero' },
      { value: '02', name: 'Febrero' },
      { value: '03', name: 'Marzo' },
      { value: '04', name: 'Abril' },
      { value: '05', name: 'Mayo' },
      { value: '06', name: 'Junio' },
      { value: '07', name: 'Julio' },
      { value: '08', name: 'Agosto' },
      { value: '09', name: 'Septiembre' },
      { value: '10', name: 'Octubre' },
      { value: '11', name: 'Noviembre' },
      { value: '12', name: 'Diciembre' }
    ],
    VOCALES: 'AEIOU',
    YEARS: {
      MIN_AGE: 17,
      MAX_AGE: 100
    },
    ANIMATION_SPEED: 200,
    SMALL_SCREEN_WIDTH: 400
  };

  // Mapas de caracteres para cálculos
  const CHAR_MAPS = {
    DIGIT_VERIFICATION: {
      '0': '00', '1': '01', '2': '02', '3': '03', '4': '04', '5': '05', '6': '06', '7': '07', '8': '08', '9': '09',
      'A': '10', 'B': '11', 'C': '12', 'D': '13', 'E': '14', 'F': '15', 'G': '16', 'H': '17', 'I': '18', 'J': '19',
      'K': '20', 'L': '21', 'M': '22', 'N': '23', '&': '24', 'O': '25', 'P': '26', 'Q': '27', 'R': '28', 'S': '29',
      'T': '30', 'U': '31', 'V': '32', 'W': '33', 'X': '34', 'Y': '35', 'Z': '36', ' ': '37', 'Ãƒâ€˜': '38'
    },
    HOMONIMIA: {
      'a': '11', 'b': '12', 'c': '13', 'd': '14', 'e': '15', 'f': '16', 'g': '17', 'h': '18', 'i': '19',
      'j': '21', 'k': '22', 'l': '23', 'm': '24', 'n': '25', 'o': '26', 'p': '27', 'q': '28', 'r': '29',
      's': '32', 't': '33', 'u': '34', 'v': '35', 'w': '36', 'x': '37', 'y': '38', 'z': '39',
      ' ': '00', 'ñ': '10', 'ü': '10'
    },
    ACCENT_FILTER: {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
      'ñ': 'n', 'Ñ': 'N'
    }
  };

  // Palabras prohibidas y excepciones
  const FORBIDDEN_WORDS = [
    "BUEI", "BUEY", "CACA", "CACO", "CAGA", "CAGO", "CAKA", "CAKO",
    "COGE", "COJA", "KOGE", "KOJO", "KAKA", "KULO", "MAME", "MAMO",
    "MEAR", "MEAS", "MEON", "MION", "COJE", "COJI", "COJO", "CULO",
    "FETO", "GUEY", "JOTO", "KACA", "KACO", "KAGA", "KAGO", "MOCO",
    "MULA", "PEDA", "PEDO", "PENE", "PUTA", "PUTO", "QULO", "RATA", "RUIN"
  ];

  const NAME_EXCEPTIONS = [
    ".", ",", "de ", "del ", "la ", "los ", "las ", "y ", "mc ", "mac ", "von ", "van ",
    "jose ", "maria ", "j ", "ma "
  ];

  const HOMONIMIA_CHARS = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZ';

  // Elementos del DOM cacheados
  const DOM_ELEMENTS = {
    form: $('#rfc_form'),
    ddmonths: $('#ddmonths'),
    ddyears: $('#ddyears'),
    dddays: $('#dddays'),
    nombre: $('#nombre'),
    ap_paterno: $('#ap_paterno'),
    ap_materno: $('#ap_materno'),
    name_rfc: $('#name_rfc'),
    dob_rfc: $('#dob_rfc'),
    rfc_result: $('#rfc_result'),
    result_rfc: $('#result_rfc'),
    rfc_form_div: $('#rfc_form_div')
  };

  // ========== INICIALIZACIÓN ==========
  
  // Cargar scripts dinámicamente
  loadScripts();
  
  // Inicializar dropdowns
  initializeMonthsDropdown();
  initializeYearsDropdown();
  
  // Inicializar validación de Bootstrap
  initializeBootstrapValidation();
  
  // Configurar eventos
  setupEventListeners();
  
  // Configurar textos de interfaz
  setupInterfaceTexts();

  // ========== FUNCIONES DE INICIALIZACIÓN ==========

  function loadScripts() {
    const fragment = document.createDocumentFragment();
    
    CONFIG.SCRIPTS.forEach(src => {
      const script = document.createElement("script");
      Object.assign(script, { src, async: false });
      document.head.appendChild(script);
    });
    
    document.head.appendChild(fragment);
  }

  function initializeMonthsDropdown() {
    const fragment = document.createDocumentFragment();
    
    CONFIG.MONTHS.forEach(month => {
      const option = document.createElement('option');
      option.value = month.value;
      option.textContent = month.name;
      fragment.appendChild(option);
    });
    
    DOM_ELEMENTS.ddmonths[0].appendChild(fragment);
  }

  function initializeYearsDropdown() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - CONFIG.YEARS.MAX_AGE;
    const endYear = currentYear - CONFIG.YEARS.MIN_AGE;
    const fragment = document.createDocumentFragment();
    
    for (let year = startYear; year <= endYear; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      option.selected = year === endYear;
      fragment.appendChild(option);
    }
    
    DOM_ELEMENTS.ddyears[0].appendChild(fragment);
  }

  function initializeBootstrapValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }

  function setupEventListeners() {
    DOM_ELEMENTS.form.on('submit', handleSubmit);
    
    // Exponer funciones globales necesarias
    window.copyRFCtoClipBoard = copyRFCtoClipBoard;
    window.repeat = repeat;
  }

  function setupInterfaceTexts() {
    const textElements = [
      "title_utr", "description_utr", "label_nombre", "error_nombre", "label_ap_paterno",
      "error_ap_paterno", "label_ap_materno", "error_ap_materno", "label_dia", "error_dia",
      "label_mes", "error_mes", "label_ano", "error_ano", "btn_calcular",
      "th_resultados", "td_nombre_label", "td_dob_label", "td_rfc_label",
    ];
    
    textElements.forEach(element => {
      if (typeof setText === 'function') setText(element);
    });
    
    // Configurar placeholders
    const placeholderConfigs = [
      { element: "dddays", placeholder: "placeholder_dia" },
      { element: "ddmonths", placeholder: "placeholder_mes" },
      { element: "ddyears", placeholder: "placeholder_ano" },
      { element: "nombre", placeholder: "placeholder_nombre" },
      { element: "ap_paterno", placeholder: "placeholder_ap_paterno" },
      { element: "ap_materno", placeholder: "placeholder_ap_materno" }
    ];
    
    placeholderConfigs.forEach(({ element, placeholder }) => {
      if (element.startsWith('dd') && typeof setFirstOptionText === 'function') {
        setFirstOptionText(element, placeholder);
      } else if (typeof setSelectPlaceholder === 'function') {
        setSelectPlaceholder(element, placeholder);
      }
    });
  }

  // ========== FUNCIONES PRINCIPALES ==========

  function handleSubmit(event) {
    event.preventDefault();
    calculateRFC();
  }

  function calculateRFC() {
    // Obtener y limpiar datos del formulario
    const formData = getFormData();
    
    // Filtrar nombres
    const filteredNames = filterNames(formData);
    
    // Generar RFC base
    const baseRFC = generateBaseRFC(filteredNames);
    
    // Procesar RFC completo
    const completeRFC = processCompleteRFC(baseRFC, formData, filteredNames);
    
    // Mostrar resultados
    displayResults(formData, completeRFC);
  }

  function getFormData() {
    return {
      ap_paterno: DOM_ELEMENTS.ap_paterno.val().trim(),
      ap_materno: DOM_ELEMENTS.ap_materno.val().trim(),
      nombre: DOM_ELEMENTS.nombre.val().trim(),
      day: DOM_ELEMENTS.dddays.val().trim(),
      month: DOM_ELEMENTS.ddmonths.val().trim(),
      year: DOM_ELEMENTS.ddyears.val().trim()
    };
  }

  function filterNames({ ap_paterno, ap_materno, nombre }) {
    return {
      ap_paterno: filterNamesAndAccents(ap_paterno),
      ap_materno: filterNamesAndAccents(ap_materno),
      nombre: filterNamesAndAccents(nombre)
    };
  }

  function filterNamesAndAccents(text) {
    return filterNameExceptions(filterAccents(text.toLowerCase()));
  }

  function generateBaseRFC({ ap_paterno, ap_materno, nombre }) {
    if (ap_paterno && ap_materno) {
      return ap_paterno.length < 3
        ? generateShortLastNameRFC(ap_paterno, ap_materno, nombre)
        : generateStandardRFC(ap_paterno, ap_materno, nombre);
    } else if (!ap_paterno && ap_materno) {
      return generateSingleLastNameRFC(nombre, ap_materno);
    } else if (ap_paterno && !ap_materno) {
      return generateSingleLastNameRFC(nombre, ap_paterno);
    }
    return '';
  }

  function processCompleteRFC(baseRFC, { year, month, day }, originalNames) {
    const dateString = year.slice(-2) + month + day;
    const cleanRFC = removeForbiddenWords(baseRFC);
    const rfcWithDate = cleanRFC.toUpperCase() + dateString;
    const rfcWithHomonimia = rfcWithDate + calculateHomonimia(originalNames);
    
    return addVerificationDigit(rfcWithHomonimia);
  }

  function displayResults({ ap_paterno, ap_materno, nombre, day, month, year }, rfc) {
    const fullName = [ap_paterno, ap_materno, nombre]
      .filter(Boolean)
      .map(s => s.toUpperCase())
      .join(' ');
    
    DOM_ELEMENTS.name_rfc.text(fullName);
    DOM_ELEMENTS.dob_rfc.text(`${day}/${month}/${year}`);
    DOM_ELEMENTS.rfc_result.text(rfc);

    // Animaciones
    fadeInElement("result_rfc");
    fadeOutElement("rfc_form_div");

    // Scroll en pantallas pequeñas
    if (window.innerWidth < CONFIG.SMALL_SCREEN_WIDTH) {
      scrollToResults();
    }
  }

  // ========== FUNCIONES DE PROCESAMIENTO RFC ==========

  function generateStandardRFC(ap_paterno, ap_materno, nombre) {
    const cleanedNames = [ap_paterno, ap_materno, nombre].map(cleanString);
    const [apPat, apMat, nom] = cleanedNames;

    // Buscar primera vocal interna del apellido paterno
    const internalVowel = findInternalVowel(apPat);

    return (
      apPat.charAt(0) +
      (internalVowel || 'X') +
      (apMat.charAt(0) || 'X') +
      (nom.charAt(0) || 'X')
    );
  }

  function generateShortLastNameRFC(ap_paterno, ap_materno, nombre) {
    const cleanedNames = [ap_paterno, ap_materno, nombre].map(cleanString);
    const [apPat, apMat, nom] = cleanedNames;

    return (
      (apPat.charAt(0) || 'X') +
      (apMat.charAt(0) || 'X') +
      (nom.slice(0, 2).padEnd(2, 'X'))
    );
  }

  function generateSingleLastNameRFC(nombre, apellido) {
    if (!nombre || !apellido) return '';

    const nom = cleanString(nombre);
    const ape = cleanString(apellido);

    return (ape.slice(0, 2) + nom.slice(0, 2)).padEnd(4, 'X');
  }

  function findInternalVowel(text) {
    for (let i = 1; i < text.length; i++) {
      if (CONFIG.VOCALES.includes(text[i].toUpperCase())) {
        return text[i].toUpperCase();
      }
    }
    return '';
  }

  function cleanString(str) {
    return (str || '').trim().toUpperCase().replace(/\s+/g, '');
  }

  function removeForbiddenWords(rfc) {
    const upperRFC = rfc.toUpperCase();
    const first4 = upperRFC.substring(0, 4);
    
    return FORBIDDEN_WORDS.includes(first4) 
      ? upperRFC.substring(0, 3) + 'X'
      : upperRFC;
  }

  function addVerificationDigit(rfc) {
    const rfcArray = Array.from(rfc);
    const numericValues = rfcArray.map(char => CHAR_MAPS.DIGIT_VERIFICATION[char] || '00');
    
    let sum = 0;
    for (let i = 13, j = 0; i > 1; i--, j++) {
      sum += parseInt(numericValues[j], 10) * i;
    }
    
    const remainder = sum % 11;
    
    if (remainder === 0) {
      return rfc + '0';
    } else if (remainder <= 10) {
      const digit = 11 - remainder;
      return rfc + (digit === 10 ? 'A' : digit.toString());
    }
    
    return rfc;
  }

  function calculateHomonimia({ ap_paterno, ap_materno, nombre }) {
    const fullName = `${ap_paterno.trim()} ${ap_materno.trim()} ${nombre.trim()}`.toLowerCase();
    
    // Convertir a representación numérica
    let numericString = '0';
    for (const char of fullName) {
      if (CHAR_MAPS.HOMONIMIA[char]) {
        numericString += CHAR_MAPS.HOMONIMIA[char];
      }
    }

    // Calcular suma según regla del SAT
    let sum = 0;
    for (let i = 0; i < numericString.length - 1; i++) {
      const num1 = parseInt(numericString.substring(i, i + 2), 10);
      const num2 = parseInt(numericString.substring(i + 1, i + 2), 10);
      
      if (!isNaN(num1) && !isNaN(num2)) {
        sum += num1 * num2;
      }
    }

    const residue = sum % 1000;
    const index1 = Math.floor(residue / 34);
    const index2 = residue % 34;

    return (
      (HOMONIMIA_CHARS[index1] || 'X') +
      (HOMONIMIA_CHARS[index2] || 'X')
    );
  }

  // ========== FUNCIONES DE FILTRADO ==========

  function filterAccents(text) {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .replace(/[áéíóúÁÉÍÓÚñÑ]/g, char => CHAR_MAPS.ACCENT_FILTER[char] || char);
  }

  function filterNameExceptions(text) {
    let filteredText = (text || '').toLowerCase();

    // Remover excepciones
    NAME_EXCEPTIONS.forEach(exception => {
      const regex = new RegExp('\\b' + exception.trim() + '\\b', 'gi');
      filteredText = filteredText.replace(regex, '');
    });

    // Manejar casos especiales
    if (filteredText.startsWith('ch')) {
      filteredText = 'c' + filteredText.slice(2);
    }
    if (filteredText.startsWith('ll')) {
      filteredText = 'l' + filteredText.slice(2);
    }

    return filteredText.trim();
  }

  // ========== FUNCIONES DE UTILIDAD ==========

  function copyRFCtoClipBoard() {
    const rfcText = DOM_ELEMENTS.rfc_result.text() || '';

    if (!rfcText) {
      alert('Elemento "rfc_result" no encontrado');
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(rfcText)
        .then(() => alert('RFC copiado al portapapeles'))
        .catch(() => fallbackCopy(rfcText));
    } else {
      fallbackCopy(rfcText);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
      alert('RFC copiado al portapapeles');
    } catch (e) {
      alert('No se pudo copiar el RFC');
    }

    document.body.removeChild(textarea);
  }

  function repeat() {
    // Limpiar resultados
    DOM_ELEMENTS.name_rfc.html("---");
    DOM_ELEMENTS.dob_rfc.html("---");
    DOM_ELEMENTS.rfc_result.html("---");
    
    // Resetear formulario
    DOM_ELEMENTS.form[0].reset();

    // Mostrar/ocultar elementos
    fadeInElement("rfc_form_div");
    fadeOutElement("result_rfc");
  }

  function fadeInElement(elementId) {
    $(`#${elementId}`).fadeIn(CONFIG.ANIMATION_SPEED).css('opacity', 1);
  }

  function fadeOutElement(elementId) {
    $(`#${elementId}`).fadeOut(CONFIG.ANIMATION_SPEED).css('opacity', 0);
  }

  function scrollToResults() {
    const targetElement = DOM_ELEMENTS.result_rfc;
    if (targetElement.length) {
      $('html, body').animate({
        scrollTop: targetElement.offset().top
      }, 400);
    }
  }
});