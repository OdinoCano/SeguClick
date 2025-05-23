function buscarCP() {
    const cp = $('#cp').val().trim();
    const $resultado = $('#resultado');
    $resultado.html('Buscando...');
    if (!/^\d{5}$/.test(cp)) {
        $resultado.html('Por favor, ingresa un código postal válido de 5 dígitos.');
        return;
    }
    $.ajax({
        url: `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const colonias = data.zip_codes;

            if (!colonias || colonias.length === 0) {
              $resultado.innerHTML = 'Código postal no encontrado.';
              return;
            }

            // Extraemos estado y municipio del primer resultado
            const { d_estado, d_mnpio } = colonias[0];

            $resultado.html(`
              <strong>Estado:</strong> ${d_estado} <br>
              <strong>Municipio:</strong> ${d_mnpio} <br>
              <strong>Colonias:</strong> <ul>
                ${colonias.map(col => `<li>${col.d_asenta} (${col.d_tipo_asenta})</li>`).join('')}
              </ul>
            `);
        },
        error: function() {
            $resultado.html('Ocurrió un error al consultar el código postal.');
        }
    });
}
$('#buscarBtn').on('click', buscarCP);