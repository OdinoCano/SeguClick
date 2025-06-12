$(document).ready(async function () {
  const waitForQRCode = () => new Promise(resolve => {
    const check = () => {
      if (window.QRCodeStyling) resolve();
      else setTimeout(check, 100);
    };
    check();
  });

  // Wait for QR Border Plugin to load
  const waitForQRBorderPlugin = () => new Promise(resolve => {
    const check = () => {
      if (window.QRBorderPlugin) resolve();
      else setTimeout(check, 100);
    };
    check();
  });

  await waitForQRCode();
  await waitForQRBorderPlugin();

  // Set the license key for QR Border Plugin (replace with your actual key)
  //if (window.QRBorderPlugin && window.QRBorderPlugin.setKey) {
  //  QRBorderPlugin.setKey("your-license-key-here");
  //}

  let qrCode = null;
  let currentImageData = null; // Para almacenar la imagen cargada

  // Función para validar archivos de imagen
  function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no válido. Use JPG, PNG, GIF, WebP o SVG.');
    }

    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 5MB.');
    }

    return true;
  }

  // Función para cargar imagen como Data URL
  function loadImageAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  // Función para mostrar errores al usuario
  function showError(message) {
    // Crear o actualizar div de error
    let errorDiv = $('#qr-error-message');
    if (errorDiv.length === 0) {
      errorDiv = $('<div id="qr-error-message" class="alert alert-danger mt-2" style="display: none;"></div>');
      $('#qr-code-generated').before(errorDiv);
    }
    
    errorDiv.html(message).fadeIn();
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      errorDiv.fadeOut();
    }, 5000);
  }

  // Función para ocultar errores
  function hideError() {
    $('#qr-error-message').fadeOut();
  }

  // Función para mostrar estado de carga
  function showLoading(show = true) {
    let loadingDiv = $('#qr-loading');
    if (loadingDiv.length === 0) {
      loadingDiv = $('<div id="qr-loading" class="text-center mt-2" style="display: none;"><div class="spinner-border" role="status"><span class="sr-only">Generando...</span></div></div>');
      $('#qr-code-generated').before(loadingDiv);
    }
    
    if (show) {
      loadingDiv.fadeIn();
    } else {
      loadingDiv.fadeOut();
    }
  }

  function getGradientConfig(gradientType, rotationId, colorClass) {
    try {
      const type = $(`input[name='${gradientType}']:checked`).val() || 'linear';
      const rotation = parseInt($(`#${rotationId}`).val()) || 0;
      const colors = $(`.${colorClass} input[type='color']`);
      
      if (colors.length < 2) {
        return null;
      }

      return {
        type: type,
        rotation: rotation,
        colorStops: [
          { offset: 0, color: colors.eq(0).val() || '#000000' },
          { offset: 1, color: colors.eq(1).val() || '#ffffff' },
        ]
      };
    } catch (error) {
      console.error(`Error getting gradient configuration for ${gradientType}:`, error);
      return null;
    }
  }

  // Extracts options from the form
  async function getBorderExtensionOptions() {
    const borderEnabled = $("#form-border-enabled").is(":checked");
    if (!borderEnabled) {
      return null;
    }
    const borderExtensionOptions = {
      round: parseFloat($("#form-border-round").val()) || 1,
      thickness: parseInt($("#form-border-thickness").val()) || 60,
      color: $("#form-border-main-color").val() || "#000000",
      decorations: {},
      borderInner: {
        color: $("#form-border-inner-color").val() || "#000000",
        thickness: parseInt($("#form-border-inner-thickness").val()) || 10,
      },
      borderOuter: {
        color: $("#form-border-outer-color").val() || "#000000",
        thickness: parseInt($("#form-border-outer-thickness").val()) || 10,
      },
    };
  
    // Top decoration
    if ($("#form-decoration-top-enabled").is(":checked")) {
      const topType = $("#form-decoration-top-type").val() || "text";
      if (topType === "text") {
        const topText = $("#form-decoration-top-text").val();
        const topFontSize = $("#form-decoration-top-font-size").val() || "30";
        const topFontFamily = $("#form-decoration-top-font-family").val() || "sans-serif";
        const topColor = $("#form-decoration-top-color").val() || "#D5B882";
        if (topText) {
          borderExtensionOptions.decorations.top = {
            type: "text",
            value: topText,
            style: `font: ${topFontSize}px ${topFontFamily}; fill: ${topColor};`,
          };
        }
      } else if (topType === "image") {
        const topImageUrl = $("#form-decoration-top-image").val();
        if (topImageUrl) {
          const cirqBord = parseInt($("#form-border-thickness").val()) || 60;
          const imageWidth = parseInt($("#form-decoration-top-image-width").val()) || 100;
          const imageHeight = parseInt($("#form-decoration-top-image-height").val()) || 50;
          const dataURL = await toDataURL(topImageUrl);
          const qrWidth = parseInt($("#form-width").val()) || 300;
          const y = Math.max(0, (cirqBord - imageHeight) / 2);
          borderExtensionOptions.decorations.top = {
            type: "image",
            value: dataURL,
            style: `width: ${imageWidth}px; height: ${imageHeight}px; x: ${(qrWidth - imageWidth) / 2}px; y: ${y}px;`
          };
          // transform: translate(-50%, 0);
        }
      }
    }
  
    // Bottom decoration
    if ($("#form-decoration-bottom-enabled").is(":checked")) {
      const bottomType = $("#form-decoration-bottom-type").val() || "text";
      if (bottomType === "text") {
        const bottomText = $("#form-decoration-bottom-text").val();
        const bottomFontSize = $("#form-decoration-bottom-font-size").val() || "30";
        const bottomFontFamily = $("#form-decoration-bottom-font-family").val() || "sans-serif";
        const bottomColor = $("#form-decoration-bottom-color").val() || "#D5B882";
        if (bottomText) {
          borderExtensionOptions.decorations.bottom = {
            type: "text",
            value: bottomText,
            style: `font: ${bottomFontSize}px ${bottomFontFamily}; fill: ${bottomColor};`,
          };
        }
      } else if (bottomType === "image") {
        const bottomImageUrl = $("#form-decoration-bottom-image").val();
        if (bottomImageUrl) {
          const cirqBord = parseInt($("#form-border-thickness").val()) || 60;
          const imageWidth = parseInt($("#form-decoration-bottom-image-width").val()) || 100;
          const imageHeight = parseInt($("#form-decoration-bottom-image-height").val()) || 50;
          const dataURL = await toDataURL(bottomImageUrl);
          const qrWidth = parseInt($("#form-width").val()) || 300;
          const qrHeight = parseInt($("#form-height").val()) || 300;
          const y = qrHeight - cirqBord + Math.max(0, (cirqBord - imageHeight) / 2);
          borderExtensionOptions.decorations.bottom = {
            type: "image",
            value: dataURL,
            style: `width: ${imageWidth}px; height: ${imageHeight}px; x: ${(qrWidth - imageWidth) / 2}px; y: ${y}px;`
          };
        }
      }
    }
  
    // Remove decorations if empty
    if (Object.keys(borderExtensionOptions.decorations).length === 0) {
      delete borderExtensionOptions.decorations;
    }
  
    console.log('Border options built:', borderExtensionOptions);
    return borderExtensionOptions;
  }

  function getQRCodeOptions() {
    try {
      const backgroundIsGradient = $("#form-background-color-type-gradient").is(":checked");
      const dotsIsGradient = $("#form-dots-color-type-gradient").is(":checked");
      const cornersSquareIsGradient = $("#form-corners-square-color-type-gradient").is(":checked");
      const cornersDotIsGradient = $("#form-corners-dot-color-type-gradient").is(":checked");

      // Validar datos de entrada
      const data = $("#form-data").val()?.trim();
      if (!data) {
        throw new Error('Por favor ingrese los datos para el código QR');
      }

      const width = parseInt($("#form-width").val());
      const height = parseInt($("#form-height").val());
      
      if (width < 100 || width > 2000) {
        throw new Error('El ancho debe estar entre 100 y 2000 píxeles');
      }
      
      if (height < 100 || height > 2000) {
        throw new Error('La altura debe estar entre 100 y 2000 píxeles');
      }

      // Obtener forma (shape) desde el switch
      const shape = $("#form-shape").is(":checked") ? "circle" : "square";

      const options = {
        width: width || 300,
        height: height || 300,
        data: data,
        margin: Math.max(0, parseInt($("#form-margin").val()) || 0),
        shape: shape, // <-- add shape to options
        dotsOptions: {
          type: $("#form-dots-type").val() || "square"
        },
        cornersSquareOptions: {
          type: $("#form-corners-square-type").val() || "square"
        },
        cornersDotOptions: {
          type: $("#form-corners-dot-type").val() || "square"
        },
        backgroundOptions: {},
        imageOptions: {
          hideBackgroundDots: $("#form-hide-background-dots").is(":checked"),
          imageSize: Math.max(0.1, Math.min(1, parseFloat($("#form-image-size").val()) || 0.4)),
          margin: Math.max(0, parseInt($("#form-image-margin").val()) || 0),
          crossOrigin: "anonymous"
        },
        qrOptions: {
          typeNumber: parseInt($("#form-qr-type-number").val()) || 0,
          mode: $("#form-qr-mode").val() || "Byte",
          errorCorrectionLevel: $("#form-qr-error-correction-level").val() || "Q"
        }
      };

      // Configurar colores de dots
      if (dotsIsGradient) {
        const gradient = getGradientConfig(
          'dots-gradient-type', 
          'form-dots-gradient-rotation', 
          'dotsOptionsHelper\\.colorType\\.gradient'
        );
        if (gradient) {
          options.dotsOptions.gradient = gradient;
        }
      } else {
        const dotsColor = $("#form-dots-color").val();
        if (dotsColor) {
          options.dotsOptions.color = dotsColor;
        }
      }

      // Configurar colores de corners square
      if (cornersSquareIsGradient) {
        const gradient = getGradientConfig(
          'corners-square-gradient-type', 
          'form-corners-square-gradient-rotation', 
          'cornersSquareOptionsHelper\\.colorType\\.gradient'
        );
        if (gradient) {
          options.cornersSquareOptions.gradient = gradient;
        }
      } else {
        const cornersSquareColor = $("#form-corners-square-color").val();
        if (cornersSquareColor && options.cornersSquareOptions.type) {
          options.cornersSquareOptions.color = cornersSquareColor;
        }
      }

      // Configurar colores de corners dot
      if (cornersDotIsGradient) {
        const gradient = getGradientConfig(
          'corners-dot-gradient-type', 
          'form-corners-dot-gradient-rotation', 
          'cornersDotOptionsHelper\\.colorType\\.gradient'
        );
        if (gradient) {
          options.cornersDotOptions.gradient = gradient;
        }
      } else {
        const cornersDotColor = $("#form-corners-dot-color").val();
        if (cornersDotColor && options.cornersDotOptions.type) {
          options.cornersDotOptions.color = cornersDotColor;
        }
      }

      // Configurar background
      if (backgroundIsGradient) {
        const gradient = getGradientConfig(
          'background-gradient-type', 
          'form-background-gradient-rotation', 
          'backgroundOptionsHelper\\.colorType\\.gradient'
        );
        if (gradient) {
          options.backgroundOptions.gradient = gradient;
        }
      } else {
        const backgroundColor = $("#form-background-color").val();
        if (backgroundColor) {
          options.backgroundOptions.color = backgroundColor;
        }
      }

      // Configurar imagen si existe
      if (currentImageData) {
        options.image = currentImageData;
      }

      return options;
    } catch (error) {
      throw new Error(`Error en configuración: ${error.message}`);
    }
  }

  // Update label text based on switch state
  $('#form-shape').on('change', function() {
    $('#shp_typ_qr').html('').text(this.checked ? setTextById("shp_typ_qr","cir_qr") : setTextById("shp_typ_qr","squ_qr"));
  }).trigger('change');

  $('#form-decoration-top-type').on('change', function() {
    const isImage = $(this).val() === 'image';
    if (isImage) {
      $("#top-image-options").removeClass("d-none");
      $("#top-text-options").addClass("d-none");
      $("#form-decoration-top-text").val("");
      $("#form-decoration-top-font-size").val("");
      $("#form-decoration-top-font-family").val("");
      $("#form-decoration-top-color").val("");
    } else {
      $("#top-image-options").addClass("d-none");
      $("#top-text-options").removeClass("d-none");
      $("#form-decoration-top-image").val("");
      $("#form-decoration-top-image-width").val("");
      $("#form-decoration-top-image-height").val("");
    }
  }).trigger('change');

  $('#form-decoration-bottom-type').on('change', function() {
    const isImage = $(this).val() === 'image';
    if (isImage) {
      $("#bottom-image-options").removeClass("d-none");
      $("#bottom-text-options").addClass("d-none");
      $("#form-decoration-bottom-text").val("");
      $("#form-decoration-bottom-font-size").val("");
      $("#form-decoration-bottom-font-family").val("");
      $("#form-decoration-bottom-color").val("");
    } else {
      $("#bottom-image-options").addClass("d-none");
      $("#bottom-text-options").removeClass("d-none");
      $("#form-decoration-bottom-image").val("");
      $("#form-decoration-bottom-image-width").val("");
      $("#form-decoration-bottom-image-height").val("");
    }
  }).trigger('change');

  async function renderQRCode() {
    try {
      showLoading(true);
      hideError();
      
      const options = getQRCodeOptions();
    
      // IMPORTANTE: Siempre limpiar y recrear el QR Code para evitar que se peguen extensiones
      $("#qr-code-generated").empty();
      qrCode = null; // Limpiar referencia anterior
    
      // Create QR Code instance
      qrCode = new QRCodeStyling(options);
    
      // Apply QR Border Plugin if available and border is enabled
      const borderExtensionOptions = await getBorderExtensionOptions();
      
      if (borderExtensionOptions && window.QRBorderPlugin) {
        try {
          qrCode.applyExtension(QRBorderPlugin(borderExtensionOptions));
        } catch (pluginError) {
          showError('Advertencia: No se pudo aplicar el plugin de bordes. Verifique la licencia.');
        }
      }
    
      qrCode.append(document.getElementById("qr-code-generated"));
    } catch (error) {
      showError(`Error al generar el código QR: ${error.message}`);
    } finally {
      showLoading(false);
    }
  }

  async function updateQR() {
    // CAMBIO IMPORTANTE: Siempre regenerar cuando hay cambios en el borde
    const borderEnabled = $("#form-border-enabled").is(":checked");
    
    if (!qrCode) {
      await renderQRCode();
      return;
    }

    try {
      hideError();

      // Si el borde está habilitado O si había un borde antes, regenerar completamente
      // Esto es necesario porque el plugin de bordes modifica la estructura del QR
      if (borderEnabled || qrCode._previouslyHadBorder) {
        await renderQRCode();
        qrCode._previouslyHadBorder = borderEnabled; // Marcar estado del borde
        return;
      }

      // Solo hacer update simple si no hay cambios de borde
      const options = getQRCodeOptions();
      qrCode.update(options);
      qrCode._previouslyHadBorder = false;

    } catch (error) {
      showError(`Error al actualizar el código QR: ${error.message}`);
      // Fallback: regenerar completamente
      await renderQRCode();
    }
  }

  // Mostrar/ocultar secciones de gradiente
  function toggleGradientSections() {
    try {
      // Background
      const backgroundIsGradient = $("#form-background-color-type-gradient").is(":checked");
      $(".backgroundOptionsHelper\\.colorType\\.single").toggleClass("d-none", backgroundIsGradient);
      $(".backgroundOptionsHelper\\.colorType\\.gradient").toggleClass("d-none", !backgroundIsGradient);

      // Dots
      const dotsIsGradient = $("#form-dots-color-type-gradient").is(":checked");
      $(".dotsOptionsHelper\\.colorType\\.single").toggleClass("d-none", dotsIsGradient);
      $(".dotsOptionsHelper\\.colorType\\.gradient").toggleClass("d-none", !dotsIsGradient);

      // Corners Square
      const cornersSquareIsGradient = $("#form-corners-square-color-type-gradient").is(":checked");
      $(".cornersSquareOptionsHelper\\.colorType\\.single").toggleClass("d-none", cornersSquareIsGradient);
      $(".cornersSquareOptionsHelper\\.colorType\\.gradient").toggleClass("d-none", !cornersSquareIsGradient);

      // Corners Dot
      const cornersDotIsGradient = $("#form-corners-dot-color-type-gradient").is(":checked");
      $(".cornersDotOptionsHelper\\.colorType\\.single").toggleClass("d-none", cornersDotIsGradient);
      $(".cornersDotOptionsHelper\\.colorType\\.gradient").toggleClass("d-none", !cornersDotIsGradient);

      // Border
      const borderIsGradient = $("#form-border-color-type-gradient").is(":checked");
      $(".borderOptionsHelper\\.colorType\\.single").toggleClass("d-none", borderIsGradient);
      $(".borderOptionsHelper\\.colorType\\.gradient").toggleClass("d-none", !borderIsGradient);
    } catch (error) {
      console.error("Error toggling gradient sections:", error);
    }
  }

  // Mostrar/ocultar opciones de border
  function toggleBorderOptions() {
    const borderEnabled = $("#form-border-enabled").is(":checked");
    $("#border-options-section").toggleClass("d-none", !borderEnabled);
  }

  // Función para manejar la carga de imágenes
  async function handleImageUpload(file) {
    try {
      if (!file) {
        currentImageData = null;
        $("#image-preview").empty().hide();
        return;
      }

      validateImageFile(file);
      
      showLoading(true);
      currentImageData = await loadImageAsDataURL(file);
      
      // Mostrar preview de la imagen
      const preview = $(`
        <div class="mt-2">
          <img src="${currentImageData}" alt="Preview" style="max-width: 100px; max-height: 100px; border-radius: 5px;">
          <p class="text-muted small mt-1">${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>
        </div>
      `);
      
      $("#image-preview").html(preview).show();
      
    } catch (error) {
      showError(error.message);
      $("#form-image-file").val("");
      currentImageData = null;
      $("#image-preview").empty().hide();
    } finally {
      showLoading(false);
    }
  }

  // Event Listeners
  // Cambios en radio buttons para mostrar/ocultar gradientes
  $("input[type=radio]").on("change", function () {
    toggleGradientSections();
    updateQR();
  });

  // Toggle border options
  $("#form-border-enabled").on("change", function () {
    toggleBorderOptions();
    renderQRCode();
  });

  // Border-related inputs should trigger regeneration
  $("#form-border-round, #form-border-thickness, #form-border-main-color, #form-border-inner-color, #form-border-inner-thickness, #form-border-outer-color, #form-border-outer-thickness, input[name='border-gradient-type'], #form-border-gradient-rotation, #form-decoration-top-enabled, #form-decoration-bottom-enabled").on("input change", function () {
    const borderEnabled = $("#form-border-enabled").is(":checked");
    if (borderEnabled) {
      renderQRCode(); // Regenerate for border changes
    }
  });

  // Cambios en cualquier input del formulario (con debounce para mejor rendimiento)
  let updateTimeout;
  $("#form input, #form select, #form textarea").on("input change", function () {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      updateQR();
    }, 300);
  });

  // Manejo de carga de imagen
  $("#form-image-file").on("change", async function () {
    const file = this.files[0];
    await handleImageUpload(file);
    updateQR();
  });

  // Descarga del QR
  $("#dl_qr").on("click", function () {
    try {
      const extension = $("#qr-extension").val() || "png";
      if (qrCode) {
        const fileName = `qr-code-${Date.now()}`;
        qrCode.download({ 
          extension: extension,
          name: fileName
        });
      } else {
        showError("Primero debe generar un código QR");
      }
    } catch (error) {
      showError("Error al descargar el código QR");
    }
  });

  // Cancelar imagen
  $("#btn_canc_qr").on("click", function () {
    $("#form-image-file").val("");
    currentImageData = null;
    $("#image-preview").empty().hide();
    updateQR();
  });

  // Limpiar colores
  $("#button-clear-corners-square-color").on("click", function () {
    $("#form-corners-square-color").val("#000000");
    updateQR();
  });

  $("#button-clear-corners-dot-color").on("click", function () {
    $("#form-corners-dot-color").val("#000000");
    updateQR();
  });

  // Botón para resetear todo el formulario
  $("#button-reset-form").on("click", function () {
    if (confirm("¿Está seguro de que desea resetear todos los valores?")) {
      $("#form")[0].reset();
      currentImageData = null;
      $("#image-preview").empty().hide();
      hideError();
      setTimeout(() => {
        toggleGradientSections();
        renderQRCode();
      }, 100);
    }
  });

  // Check if QR Border Plugin is loaded
  function checkPluginStatus() {
    if (!window.QRBorderPlugin) {
      showError('Advertencia: Plugin de bordes no encontrado. Algunos efectos de borde podrían no funcionar.');
    }
  }

  // Generar QR inicial
  setTimeout(async () => {
    checkPluginStatus();
    toggleGradientSections();
    toggleBorderOptions();
    await renderQRCode();
  }, 100);

  // Manejo de errores globales para el QR
  window.addEventListener('error', function(e) {
    if (e.message.includes('QR')) {
      showError('Error inesperado al generar el código QR');
    }
  });

  // Add options to top decoration type select
  $('#form-decoration-top-type')
    .append('<option value="text">' + (getText("text") || "Text") + '</option>')
    .append('<option value="image">' + (getText("img") || "Image") + '</option>');

  // Add options to bottom decoration type select
  $('#form-decoration-bottom-type')
    .append('<option value="text">' + (getText("text") || "Text") + '</option>')
    .append('<option value="image">' + (getText("img") || "Image") + '</option>');
  
  $("#form-dots-type")
    .append('<option value="square">' + (getText("squ") || "Square") + '</option>')
    .append('<option value="dots">' + (getText("dots") || "Dots") + '</option>')
    .append('<option value="rounded">' + (getText("rnd") || "Rounded") + '</option>')
    .append('<option value="extra-rounded">' + (getText("xtra_rnd") || "Extra rounded") + '</option>')
    .append('<option value="classy">' + (getText("cls") || "Classy") + '</option>')
    .append('<option value="classy-rounded">' + (getText("cls_rnd") || "Classy rounded") + '</option>');

  $("#form-corners-square-type")
    .append('<option value="">' + (getText("none") || "None") + '</option>')
    .append('<option value="square">' + (getText("squ") || "Square") + '</option>')
    .append('<option value="dots">' + (getText("dot") || "Dot") + '</option>')
    .append('<option value="extra-rounded">' + (getText("xtra_rnd") || "Extra rounded") + '</option>')
  
  $("#form-corners-dot-type")
    .append('<option value="">' + (getText("none") || "None") + '</option>')
    .append('<option value="square">' + (getText("squ") || "Square") + '</option>')
    .append('<option value="dots">' + (getText("dot") || "Dot") + '</option>');

  $("#form-qr-mode")
    .append('<option value="Numeric">' + (getText("numeric") || "Numeric") + '</option>')
    .append('<option value="Alphanumeric">' + (getText("alphanum") || "Alphanumeric") + '</option>')
    .append('<option value="Byte" selected>' + (getText("byte") || "Byte") + '</option>')
    .append('<option value="Kanji">' + (getText("kanji") || "Kanji") + '</option>');

  $("#form-qr-error-correction-level")
    .append('<option value="L">' + (getText("low") || "Low") + '</option>')
    .append('<option value="M">' + (getText("medium") || "Medium") + '</option>')
    .append('<option value="Q" selected>' + (getText("quartile") || "Quartile") + '</option>')
    .append('<option value="H">' + (getText("high") || "High") + '</option>');

  [
    "title_qr","dl_qr","ext_qr","main_options_qr","data_qr",
    "image_file_qr","btn_canc_qr","width_qr","height_qr","margin_qr",
    "shape_qr","border_options_qr","enb_bdr_qr","bdr_thk_qr","bdr_rd_qr",
    "inner_bdr_thk_qr","inner_bdr_col_qr","outr_bdr_thk_qr","outr_bdr_col_qr","en_top_deco_qr",
    "top_bdr_deco_typ_qr","top_bdr_text_qr","top_bdr_font_sz_qr","top_bdr_font_fam_qr","top_bdr_font_fam_qr",
    "top_bdr_txt_col_qr","top_bdr_img_url_qr","top_bdr_img_w_qr","top_bdr_img_h_qr","en_bottom_deco_qr",
    "btm_bdr_deco_typ_qr","btm_bdr_text_qr","btm_bdr_font_sz_qr","btm_bdr_font_fam_qr","btm_bdr_font_fam_qr",
    "btm_bdr_txt_col_qr","btm_bdr_img_url_qr","btm_bdr_img_w_qr","btm_bdr_img_h_qr","dots_options_qr",
    "dots_st_qr","col_typ_qr","sg_col_qr","col_grad_qr","dot_col_qr",
    "dot_grad_qr","cors_squ_opt_qr","cors_squ_st_qr","cors_squ_col_qr","cors_squ_grad_qr",
    "cors_dot_opt_qr","cors_dot_col_qr","cors_dot_grad_qr","bkgd_opt_qr","bkgd_col_qr",
    "bkgd_grad_qr","img_opt_qr","hide_bkgd_dot_qr","img_sz_qr","margin",
    "opt_qr","typ_num_qr","mode","err_corr_lvl_qr"
  ].forEach(element => {
      setText(element);
  });
  setTextById("shp_typ_qr","cir_qr");
  [
    "col_typ_qr","sg_col_qr","col_grad_qr","grad_typ_qr","linear",
    "radial","rotation","clear"
  ].forEach(type => {
    setTextByClass(type)
  });
  [
    {cls:"rotation", ph:"placeholder_zero_three_hundred_sixty_qr"},
  ].forEach(({cls, ph}) => setInputPlaceholderByClass(cls, ph));
  [
    {id:"width_qr", ph:"placeholder_hundred_teenk_qr"},
    {id:"height_qr", ph:"placeholder_hundred_teenk_qr"},
    {id:"margin_qr", ph:"placeholder_zero_teenk_qr"},
    {id:"bdr_thk_qr", ph:"placeholder_one_two_hundred_qr"},
    {id:"bdr_rd_qr", ph:"placeholder_zero_one_qr"},
    {id:"inner_bdr_thk_qr", ph:"placeholder_zero_fifty"},
    {id:"outr_bdr_thk_qr", ph:"placeholder_zero_fifty"},
    {id:"top_bdr_text_qr", ph:"placeholder_top_txt"},
    {id:"top_bdr_font_sz_qr", ph:"placeholder_eigth_seventy_two"},
    {id:"top_bdr_img_url_qr", ph:"placeholder_uri_eg_img"},
    {id:"top_bdr_img_w_qr", ph:"placeholder_ten_five_hundred"},
    {id:"top_bdr_img_h_qr", ph:"placeholder_ten_five_hundred"},
    {id:"btm_bdr_text_qr", ph:"placeholder_btm_txt"},
    {id:"btm_bdr_font_sz_qr", ph:"placeholder_eigth_seventy_two"},
    {id:"btm_bdr_img_url_qr", ph:"placeholder_uri_eg_img"},
    {id:"btm_bdr_img_w_qr", ph:"placeholder_ten_five_hundred"},
    {id:"btm_bdr_img_h_qr", ph:"placeholder_ten_five_hundred"},
    {id:"img_sz_qr", ph:"placeholder_zero_one_qr"},
    {id:"margin", ph:"placeholder_zero_teenk_qr"},
    {id:"typ_num_qr", ph:"placeholder_zero_forty"},
  ].forEach(({id, ph}) => setInputPlaceholder(id, ph));
});
