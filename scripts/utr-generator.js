/*
// MODELOS DE AUTOS
(function() {
  var $select = $('#ddyears');
  var currentYear = new Date().getFullYear();
  var startYear = 1885;
  var endYear = currentYear + 2;
  for (var y = startYear; y <= endYear; y++) {
    var $opt = $('<option>', {
      value: y,
      text: y,
      selected: y === currentYear
    });
    $select.append($opt);
  }
})();*/
(function() {
  var $select = $('#ddmonths');
  var months = [
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
  ];
  months.forEach(function(month) {
    var $opt = $('<option>', {
      value: month.value,
      text: month.name
    });
    $select.append($opt);
  });
})();

(function() {
  var $select = $('#ddyears');
  var currentYear = new Date().getFullYear();
  var startYear = currentYear - 61;
  var endYear = currentYear - 17;
  for (var y = startYear; y <= endYear; y++) {
    var $opt = $('<option>', {
      value: y,
      text: y,
      selected: y === endYear
    });
    $select.append($opt);
  }
})();

// Bootstrap validation
(function () {
  'use strict'
  var forms = document.querySelectorAll('.needs-validation')
  Array.prototype.slice.call(forms)
    .forEach(function (form) {
      form.addEventListener('submit', function (event) {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
        form.classList.add('was-validated')
      }, false)
    })
})()

function copyRFCtoClipBoard() {
  const $rfcResult = $('#rfc_result');
  if (!$rfcResult.length) {
    alert('Elemento "rfc_result" no encontrado');
    return;
  }

  const text = $rfcResult.text() || '';

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => alert('RFC copiado al portapapeles'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    const $tempTextarea = $('<textarea>').val(text)
      .css({ position: 'fixed', opacity: '0' });

    $('body').append($tempTextarea);
    $tempTextarea.focus().select();

    try {
      document.execCommand('copy');
      alert('RFC copiado al portapapeles');
    } catch (e) {
      alert('No se pudo copiar el RFC');
    }

    $tempTextarea.remove();
  }
}

function handleSubmit(event) {
  event.preventDefault();
  calcula() 
}

$('#rfc_form').on('submit', handleSubmit);

function calcula() {
  // Obtener valores del formulario y limpiar
  const ap_paterno = $('#ap_paterno').val().trim();
  const ap_materno = $('#ap_materno').val().trim();
  const nombre = $('#nombre').val().trim();
  const day = $('#dddays').val().trim();
  const month = $('#ddmonths').val().trim();
  const year = $('#ddyears').val().trim();
  const dteNacimiento = year.slice(-2) + month + day;

  // Filtrar acentos y nombres
  let ap_pat_f = RFCFiltraNombres(RFCFiltraAcentos(ap_paterno.toLowerCase()));
  let ap_mat_f = RFCFiltraNombres(RFCFiltraAcentos(ap_materno.toLowerCase()));
  let nombre_f = RFCFiltraNombres(RFCFiltraAcentos(nombre.toLowerCase()));

  const ap_pat_orig = ap_pat_f;
  const ap_mat_orig = ap_mat_f;
  const nombre_orig = nombre_f;

  let rfc = '';
  if (ap_pat_f && ap_mat_f) {
    rfc = ap_pat_f.length < 3
      ? RFCApellidoCorto(ap_pat_f, ap_mat_f, nombre_f)
      : RFCArmalo(ap_pat_f, ap_mat_f, nombre_f);
  } else if (!ap_pat_f && ap_mat_f) {
    rfc = RFCUnApellido(nombre_f, ap_mat_f);
  } else if (ap_pat_f && !ap_mat_f) {
    rfc = RFCUnApellido(nombre_f, ap_pat_f);
  }

  rfc = RFCQuitaProhibidas(rfc);
  rfc = rfc.toUpperCase() + dteNacimiento + homonimia(ap_pat_orig, ap_mat_orig, nombre_orig);
  rfc = RFCDigitoVerificador(rfc);

  // Mostrar resultados en pantalla
  $('#name_rfc').text(
    [ap_paterno, ap_materno, nombre].map(s => s.toUpperCase()).join(' ')
  );
  $('#dob_rfc').text(`${day}/${month}/${year}`);
  $('#rfc_result').text(rfc);

  fadeInElement("result_rfc");
  fadeOutElement("rfc_form_div");

  // Scroll para pantallas pequeñas
  if (window.innerWidth < 400) {
    const $targetDiv = $('#result_rfc');
    if ($targetDiv.length) {
      $('html, body').animate({
        scrollTop: $targetDiv.offset().top
      }, 400);
    }
  }

  return false;
}

function RFCDigitoVerificador(rfc) {
  const charMap = {
    '0': '00', '1': '01', '2': '02', '3': '03', '4': '04', '5': '05', '6': '06', '7': '07', '8': '08', '9': '09',
    'A': '10', 'B': '11', 'C': '12', 'D': '13', 'E': '14', 'F': '15', 'G': '16', 'H': '17', 'I': '18', 'J': '19',
    'K': '20', 'L': '21', 'M': '22', 'N': '23', '&': '24', 'O': '25', 'P': '26', 'Q': '27', 'R': '28', 'S': '29',
    'T': '30', 'U': '31', 'V': '32', 'W': '33', 'X': '34', 'Y': '35', 'Z': '36', ' ': '37', 'Ãƒâ€˜': '38'
  };

  const rfcsuma = Array.from(rfc).map(letra => charMap[letra] || '00');
  let nv = 0;
  for (let i = 13, y = 0; i > 1; i--, y++) {
    nv += parseInt(rfcsuma[y], 10) * i;
  }
  nv = nv % 11;
  if (nv === 0) {
    rfc += nv;
  } else if (nv <= 10) {
    nv = 11 - nv;
    rfc += nv === 10 ? 'A' : nv;
  }
  return rfc;
}

function RFCQuitaProhibidas(rfc) {
  const prohibidas = [
    "BUEI", "BUEY", "CACA", "CACO", "CAGA", "CAGO", "CAKA", "CAKO",
    "COGE", "COJA", "KOGE", "KOJO", "KAKA", "KULO", "MAME", "MAMO",
    "MEAR", "MEAS", "MEON", "MION", "COJE", "COJI", "COJO", "CULO",
    "FETO", "GUEY", "JOTO", "KACA", "KACO", "KAGA", "KAGO", "MOCO",
    "MULA", "PEDA", "PEDO", "PENE", "PUTA", "PUTO", "QULO", "RATA", "RUIN"
  ];
  rfc = rfc.toUpperCase();
  if (prohibidas.includes(rfc.substr(0, 4))) {
    return rfc.substr(0, 3) + 'X';
  }
  return rfc;
}

function RFCUnApellido(nombre, apellido) {
  if (!nombre || !apellido) return '';

  const clean = str => str.trim().toUpperCase().replace(/\s+/g, '');
  const nom = clean(nombre);
  const ape = clean(apellido);

  return (ape.slice(0, 2) + nom.slice(0, 2)).padEnd(4, 'X');
}

function RFCArmalo(ap_paterno, ap_materno, nombre) {
  const vocales = 'AEIOU';

  const clean = str => str.trim().toUpperCase().replace(/\s+/g, '');

  ap_paterno = clean(ap_paterno);
  ap_materno = clean(ap_materno);
  nombre = clean(nombre);

  // Obtener primera vocal interna del apellido paterno (no la primera letra)
  let vocalInterna = '';
  for (let i = 1; i < ap_paterno.length; i++) {
    if (vocales.includes(ap_paterno[i])) {
      vocalInterna = ap_paterno[i];
      break;
    }
  }

  // Construir RFC base
  const rfc = (
    ap_paterno.charAt(0) +
    (vocalInterna || 'X') +
    (ap_materno.charAt(0) || 'X') +
    (nombre.charAt(0) || 'X')
  );

  return rfc;
}

function RFCApellidoCorto(ap_paterno, ap_materno, nombre) {
  const clean = str => (str || '').trim().toUpperCase();
  ap_paterno = clean(ap_paterno);
  ap_materno = clean(ap_materno);
  nombre = clean(nombre);

  return (
    (ap_paterno.charAt(0) || 'X') +
    (ap_materno.charAt(0) || 'X') +
    (nombre.slice(0, 2).padEnd(2, 'X'))
  );
}

function RFCFiltraNombres(strTexto) {
  const excepciones = [
    ".", ",", "de ", "del ", "la ", "los ", "las ", "y ", "mc ", "mac ", "von ", "van ",
    "jose ", "maria ", "j ", "ma "
  ];

  let texto = (strTexto || '').toLowerCase();

  for (const palabra of excepciones) {
    texto = texto.replace(new RegExp('\\b' + palabra.trim() + '\\b', 'gi'), '');
  }

  if (texto.startsWith('ch')) texto = 'c' + texto.slice(2);
  if (texto.startsWith('ll')) texto = 'l' + texto.slice(2);

  return texto.trim();
}

function RFCFiltraAcentos(strTexto) {
  const mapa = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
    'ñ': 'n', 'Ñ': 'N'
  };

  return (strTexto || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina tildes
    .replace(/[^\w\s]/gi, '')        // elimina símbolos raros si es necesario
    .replace(/[áéíóúÁÉÍÓÚñÑ]/g, c => mapa[c] || c);
}

function homonimia(ap_paterno, ap_materno, nombre) {
  const nombreCompleto = `${ap_paterno.trim()} ${ap_materno.trim()} ${nombre.trim()}`.toLowerCase();

  const letraMap = {
    'a': '11', 'b': '12', 'c': '13', 'd': '14', 'e': '15', 'f': '16', 'g': '17', 'h': '18', 'i': '19',
    'j': '21', 'k': '22', 'l': '23', 'm': '24', 'n': '25', 'o': '26', 'p': '27', 'q': '28', 'r': '29',
    's': '32', 't': '33', 'u': '34', 'v': '35', 'w': '36', 'x': '37', 'y': '38', 'z': '39',
    ' ': '00', 'ñ': '10', 'ü': '10'
  };

  // Convertir el nombre completo a su representación numérica
  let numero = '0';
  for (let i = 0; i < nombreCompleto.length; i++) {
    const char = nombreCompleto[i];
    if (letraMap[char]) {
      numero += letraMap[char];
    }
  }

  // Sumar los productos conforme a la regla del SAT
  let suma = 0;
  for (let i = 0; i < numero.length - 1; i++) {
    const num1 = parseInt(numero.substr(i, 2), 10);
    const num2 = parseInt(numero.substr(i + 1, 1), 10);
    if (!isNaN(num1) && !isNaN(num2)) {
      suma += num1 * num2;
    }
  }

  const residuo = suma % 1000;
  const indice1 = Math.floor(residuo / 34);
  const indice2 = residuo % 34;

  const homonimiaChars = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZ';

  const homonimio =
    (homonimiaChars[indice1] || 'X') +
    (homonimiaChars[indice2] || 'X');

  return homonimio;
}

function repeat() {
  $("#name_rfc, #dob_rfc, #rfc_result").html("---");
  $("#rfc_form")[0].reset();

  fadeInElement("rfc_form_div");
  fadeOutElement("result_rfc");
}

function fadeInElement(id) {
  $('#' + id).fadeIn(200).css('opacity', 1);
}

function fadeOutElement(id) {
  $('#' + id).fadeOut(200).css('opacity', 0);
}

[
  "title_utr","description_utr","label_nombre","error_nombre","label_ap_paterno",
  "error_ap_paterno","label_ap_materno","error_ap_materno","label_dia","error_dia",
  "label_mes","error_mes","label_ano","error_ano","btn_calcular",
  "th_resultados","td_nombre_label","td_dob_label","td_rfc_label",
].forEach(element => {
    setText(element);
});
setFirstOptionText("dddays", "placeholder_dia");
setFirstOptionText("ddmonths", "placeholder_mes");
setFirstOptionText("ddyears", "placeholder_ano");
setSelectPlaceholder("nombre", "placeholder_nombre");
setSelectPlaceholder("ap_paterno", "placeholder_ap_paterno");
setSelectPlaceholder("ap_materno", "placeholder_ap_materno");