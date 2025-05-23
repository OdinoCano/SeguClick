$('#cp').on('change', function() {
  $(this).prop('hidden', true);
  $('#resultado').html(`<strong>C.P.:</strong> ${$(this).val()}`);
});

$('#municipio').on('change', function() {
  const $resultado = $('#resultado');
  const pcSeleccionado = $(this).find('option:selected').data('pc');
  if (pcSeleccionado) {
    $resultado.html(`<strong>C.P. aproximado:</strong> ${pcSeleccionado}`);
  } else {
    $resultado.html('No hay C.P. seleccionado en el municipio.');
  }
});

$('#estado').on('change', function() {
  const estadoSeleccionado = $(this).val();
  const $municipio = $('#municipio');
  $municipio.html('<option>Cargando...</option>');
  // Llama a la API para obtener municipios por estado
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
      $municipio.append(municipios.map(m => `<option value="${m.id}" data-pc="${m.zip_code}">${m.name}</option>`).join(''));
    },
    error: function() {
      $municipio.html('<option>Error al cargar municipios</option>');
    }
  });
});

function buscarCP() {
  const $resultado = $('#resultado').html('');
  const $colonia = encodeURIComponent($('#colonia').val().trim());
  const $ciudad = encodeURIComponent($('#ciudad').val().trim());
  const $estado = encodeURIComponent($('#estado option:selected').text());
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

$('#buscarBtn').on('click', buscarCP);