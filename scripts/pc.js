document.addEventListener("DOMContentLoaded", function () {
  const scripts = [
    "/scripts/bootstrap.bundle.5.3.6.min.js",
    "/scripts/lottie-web.5.13.0.min.js",
    "/scripts/menu.js",
  ];

  scripts.forEach(src => {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  });

  const lang = chrome.i18n.getUILanguage()

  setFirstOptionText("cntry_pc", "placeholder_cntry");
  setFirstOptionText("st_pc", "placeholder_st");
  setSelectPlaceholder("cty_pc", "placeholder_cty");
  setSelectPlaceholder("col_pc", "placeholder_col");

  if (lang !== 'es-MX') {
    $("#municipality_pc").parent().hide();
    $("#or_pc").hide();

    // Llenar select de países
    $.getJSON('/json/country.json', function(data) {
      const $country = $('#cntry_pc');
      Object.entries(data).forEach(([code, country]) => {
        $country.append(`<option value="${code}">${country.name}</option>`);
      });
    }).fail(function() {
      $('#cntry_pc').html('<option>Error al cargar países</option>');
    });
  } else {
    // Código para México
    $('#country_pc').parent().hide();

    const $estados = $('#st_pc');
    $estados.html('<option value="">Selecciona un estado</option>');

    $.getJSON('/json/country.json', function(data) {
      const mexicoStates = data.mx.states || [];
      mexicoStates.forEach(({ name, num }) => {
        $estados.append(`<option value="${num}">${name}</option>`);
      });
    }).fail(function() {
      $('#cntry_pc').html('<option>Error al cargar países</option>');
    });
  }

  $('#cp').on('change', function() {
    $(this).prop('hidden', true);
    $('#resultado').html(`<strong>C.P.:</strong> ${$(this).val()}`);
  });

  $('#mun_pc').on('change', function() {
    const $resultado = $('#resultado');
    const pcSeleccionado = $(this).find('option:selected').data('pc');
    if (pcSeleccionado) {
      $resultado.html(`<strong>C.P. aproximado:</strong> ${pcSeleccionado}`);
    } else {
      $resultado.html('No hay C.P. seleccionado en el municipio.');
    }
  });

  $('#cntry_pc').on('change', function() {
    const countryCode = $(this).val();
    const $state = $('#st_pc');

    $state.prop('disabled', !countryCode);

    if (!countryCode) return;

    $state.html('')
    setFirstOptionText("st_pc", "placeholder_st");

    $.getJSON('/json/country.json', function(data) {
      const estados = data[countryCode].states || [];
      estados.forEach(s => {
        $state.append(`<option value="${s.code}">${s.name}</option>`);
      });
    }).fail(function() {
      $state.html('<option>Error loading states</option>');
    });
    $state.prop('disabled', false);
  });

  // Evento change del estado para México
  $('#st_pc').on('change', function() {
    if(lang === 'es-MX'){
      const estadoSeleccionado = $(this).val();
      const $municipio = $('#mun_pc');
      $municipio.html('<option>Cargando...</option>');

      $.ajax({
        url: `https://sepomex.icalialabs.com/api/v1/states/${estadoSeleccionado}/municipalities`,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
          const municipios = [...new Set(data.municipalities)];
          if (municipios.length === 0) {
            $municipio.html('<option>No hay municipios</option>');
            return;
          }

          $municipio.html('<option value="">Selecciona un municipio</option>');
          $municipio.append(municipios.map(m => 
            `<option value="${m.id}" data-pc="${m.zip_code}">${m.name}</option>`
          ).join(''));
        },
        error: function() {
          $municipio.html('<option>Error al cargar municipios</option>');
        }
      });
    }
  });

  function buscarCP() {
    const $resultado = $('#resultado').html('');
    const $colonia = encodeURIComponent($('#col_pc').val().trim());
    const $ciudad = encodeURIComponent($('#cty_pc').val().trim());
    const $estado = encodeURIComponent($('#st_pc option:selected').text());
    let url = `https://sepomex.icalialabs.com/api/v1/zip_codes?`;
    let path = [];
    if ($colonia.length > 3) {
      path.push(`colony=${$colonia}`);
    }
    if ($ciudad.length > 3) {
      path.push(`city=${$ciudad}`);
    }
    if ($estado.length > 0) {
      path.push(`state=${$estado}`);
    }
    $.ajax({
      url: url + path.join('&'),
      method: 'GET',
      dataType: 'json',
      success: function(data) {
        const cp = [...new Set(data.zip_codes)];
        if (cp.length === 0) {
          $colonia.html('<strong>No hay C.P. con los datos proporcionados</strong>');
          return;
        } else if (cp.length === 1) {
          $resultado.html(`<strong>C.P.:</strong> ${cp[0].d_codigo}`);
          return;
        } else {
          const $lista = $('#cp');
          $lista.prop('hidden', false).html('');
          $lista.append(`<option value="">Selecciona una colónia</option>`);
          cp.forEach(function(item) {
            $lista.append(`<option value="${item.d_codigo}">${item.d_tipo_asenta}: ${item.d_asenta}</option>`);
          });
        }
      },
      error: function() {
        $resultado.html('Error al cargar municipios');
      }
    });
  }

  // Función de búsqueda para Zippopotam.us
  function buscarCPZippopotam() {
    const $resultado = $('#resultado').html('');
    const countryCode = $('#cntry_pc').val();
    const stateCode = $('#st_pc').val();
    const city = encodeURIComponent($('#cty_pc').val().trim());

    if (!countryCode || !stateCode || !city) {
      $resultado.html('Por favor completa todos los campos');
      return;
    }

    $resultado.html('Buscando códigos postales...');

    $.ajax({
      url: `https://api.zippopotam.us/${countryCode}/${stateCode}/${city}`,
      method: 'GET',
      dataType: 'json',
      success: function(data) {
        const postCodes = [...new Set(data.places.map(p => p['post code']))];

        if (postCodes.length === 0) {
          $resultado.html('No se encontraron códigos postales');
        } else if (postCodes.length === 1) {
          $resultado.html(`<strong>C.P.:</strong> ${postCodes[0]}`);
        } else {
          const $cpSelect = $('#cp');
          $cpSelect.prop('hidden', false).html('');
          $cpSelect.append(`<option value="">Selecciona un código postal</option>`);

          postCodes.forEach(pc => {
            // Buscar el lugar específico para este código postal
            const place = data.places.find(p => p['post code'] === pc);
            const placeName = place ? place['place name'] : '';

            $cpSelect.append(`<option value="${pc}">${placeName}</option>`);
          });
        }
      },
      error: function(xhr) {
        let msg = 'Error al consultar códigos postales';
        if (xhr.status === 404) msg = 'No se encontraron códigos postales';
        $resultado.html(`Error: ${msg}`);
      }
    });
  }

  $('#search_btn_pc').on('click', function() {
    if (lang === 'es-MX') {
      buscarCP(); // Función original para México
    } else {
      buscarCPZippopotam(); // Nueva función para Zippopotam
    }
  });

  [
    "title_pc", "country_pc", "state_pc", "city_pc", "colony_pc",
    "or_pc", "municipality_pc", "search_btn_pc"
  ].forEach(element => {
      setText(element);
  });
});