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
  if (window.QRBorderPlugin && window.QRBorderPlugin.setKey) {
    QRBorderPlugin.setKey("your-license-key-here");
  }

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
        console.warn(`No se encontraron suficientes colores para el gradiente ${gradientType}`);
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
      console.error(`Error obteniendo configuración de gradiente ${gradientType}:`, error);
      return null;
    }
  }

  function getBorderExtensionOptions() {
    const borderEnabled = $("#form-border-enabled").is(":checked");
    if (!borderEnabled) return null;

    const borderIsGradient = $("#form-border-color-type-gradient").is(":checked");
    const borderOptions = {
      width: parseInt($("#form-border-width").val()) || 10,
      radius: parseInt($("#form-border-radius").val()) || 10
    };

    if (borderIsGradient) {
      const gradient = getGradientConfig(
        'border-gradient-type', 
        'form-border-gradient-rotation', 
        'borderOptionsHelper\\.colorType\\.gradient'
      );
      if (gradient) {
        borderOptions.gradient = gradient;
      }
    } else {
      const borderColor = $("#form-border-color").val();
      if (borderColor) {
        borderOptions.color = borderColor;
      }
    }

    return borderOptions;
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

      const options = {
        width: width || 300,
        height: height || 300,
        data: data,
        margin: Math.max(0, parseInt($("#form-margin").val()) || 0),
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

  async function renderQRCode() {
    try {
      showLoading(true);
      hideError();
      
      const options = getQRCodeOptions();

      // Limpiar QR anterior
      if (qrCode) {
        $("#qr-code-generated").empty();
      }

      // Create QR Code instance
      qrCode = new QRCodeStyling(options);

      // Apply QR Border Plugin if available and border is enabled
      const borderExtensionOptions = getBorderExtensionOptions();
      if (borderExtensionOptions && window.QRBorderPlugin) {
        try {
          // Apply the border extension with options
          qrCode.applyExtension(QRBorderPlugin(borderExtensionOptions));
          console.log('QR Border Plugin applied successfully');
        } catch (pluginError) {
          console.warn('Failed to apply QR Border Plugin:', pluginError);
          showError('Advertencia: No se pudo aplicar el plugin de bordes. Verifique la licencia.');
        }
      }

      qrCode.append(document.getElementById("qr-code-generated"));
      
    } catch (error) {
      console.error("Error generating QR code:", error);
      showError(`Error al generar el código QR: ${error.message}`);
    } finally {
      showLoading(false);
    }
  }

  async function updateQR() {
    if (!qrCode) {
      await renderQRCode();
      return;
    }
    
    try {
      hideError();

      // For updates with border plugin, it's safer to regenerate
      const borderEnabled = $("#form-border-enabled").is(":checked");
      if (borderEnabled && window.QRBorderPlugin) {
        await renderQRCode(); // Regenerate when border options change
        return;
      }

      const options = getQRCodeOptions();
      qrCode.update(options);
    } catch (error) {
      console.error("Error updating QR code:", error);
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
      console.error("Error handling image upload:", error);
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
    updateQR();
  });

  // Border-related inputs should trigger regeneration
  $("#form-border-width, #form-border-radius, #form-border-color, input[name='border-gradient-type'], #form-border-gradient-rotation").on("input change", function () {
    const borderEnabled = $("#form-border-enabled").is(":checked");
    if (borderEnabled) {
      renderQRCode(); // Regenerate for border changes
    } else {
      updateQR();
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
  $("#qr-download").on("click", function () {
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
      console.error("Error downloading QR:", error);
      showError("Error al descargar el código QR");
    }
  });

  // Cancelar imagen
  $("#button-cancel").on("click", function () {
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
    if (window.QRBorderPlugin) {
      console.log('QR Border Plugin is available');
    } else {
      console.warn('QR Border Plugin not found. Make sure to include the plugin script.');
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
});