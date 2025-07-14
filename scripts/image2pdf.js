$(document).ready(function() {
  // Variables globales para manejar las imágenes
  let imageData = [];
  let sortableInstance = null;

  // Inicializar la aplicación
  function initializeApp() {
    setupFileInput();
    setupEventListeners();
    setupDragAndDrop();
    loadTexts();
    loadExternalScripts();
  }

  // Configurar input de archivos
  function setupFileInput() {
    const $fileInput = $('#images');
    $fileInput.on('change', handleFileSelection);
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Evento del formulario
    $('#imageToPdfForm').on('submit', handleFormSubmit);
    
    // Botón de descarga
    $('#btn_dl_img2pdf').on('click', handleDownload);
    
    // Botones de control global
    $(document).on('click', '#resetAllBtn', resetAllImages);
    $(document).on('click', '#clearAllBtn', clearAllImages);
    
    // Controles individuales de imagen
    $(document).on('input', '.rotation-slider', handleRotationChange);
    $(document).on('input', '.scale-slider', handleScaleChange);
    $(document).on('click', '.rotate-btn', handleRotateButton);
    $(document).on('click', '.reset-btn', handleResetImage);
    $(document).on('click', '.delete-btn', handleDeleteImage);
  }

  // Configurar drag and drop
  function setupDragAndDrop() {
    const $dropZone = $('#dragDropZone');
    const $fileInput = $('#images');

    $dropZone.on('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).addClass('drag-over');
    });

    $dropZone.on('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).removeClass('drag-over');
    });

    $dropZone.on('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).removeClass('drag-over');
    
      const files = e.originalEvent.dataTransfer.files;
      handleFiles(files);
    });

    $dropZone.on('click', function(e) {
      if (e.target !== $fileInput[0]) {
        $fileInput.trigger('click');
      }
    });
  }

  // Manejar selección de archivos
  function handleFileSelection(e) {
    const files = e.target.files;
    handleFiles(files);
  }

  // Procesar archivos
  async function handleFiles(files) {
    if (!files || files.length === 0) return;

    showProgress();
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      showMessage('Por favor selecciona solo archivos de imagen.', 'warning');
      hideProgress();
      return;
    }

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const progress = ((i + 1) / validFiles.length) * 100;
        updateProgress(progress);
        
        await processImage(file);
      }
      
      renderImagePreviews();
      showControlButtons();
      hideProgress();
      
    } catch (error) {
      console.error('Error al procesar imágenes:', error);
      showMessage('Error al procesar las imágenes.', 'danger');
      hideProgress();
    }
  }

  // Procesar imagen individual
  function processImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
          const imageInfo = {
            id: Date.now() + Math.random(),
            file: file,
            src: e.target.result,
            width: img.width,
            height: img.height,
            rotation: 0,
            scale: 1.0,
            originalWidth: img.width,
            originalHeight: img.height,
            name: file.name
          };
          
          imageData.push(imageInfo);
          resolve(imageInfo);
        };
        
        img.onerror = reject;
        img.src = e.target.result;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Renderizar previsualizaciones
  function renderImagePreviews() {
    const $container = $('#imagePreviewContainer');
    
    // Crear contenedor si no existe
    if ($container.length === 0) {
      const previewHTML = `
        <div class="mt-4">
          <h5>Vista Previa y Edición</h5>
          <div class="mb-3">
            <button type="button" class="btn btn-sm btn-outline-secondary" id="resetAllBtn">
              <i class="bi bi-arrow-clockwise"></i> Resetear Todo
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger ms-2" id="clearAllBtn">
              <i class="bi bi-trash"></i> Limpiar Todo
            </button>
          </div>
          <div id="imagePreviewContainer" class="row g-3"></div>
        </div>
      `;
      $('#imageToPdfForm').after(previewHTML);
    }

    const $previewContainer = $('#imagePreviewContainer');
    $previewContainer.empty();

    imageData.forEach((img, index) => {
      const $imageCard = createImageCard(img, index);
      $previewContainer.append($imageCard);
    });

    // Inicializar sortable si hay múltiples imágenes
    if (imageData.length > 1) {
      initializeSortable();
    }
  }

  // Crear tarjeta de imagen
  function createImageCard(img, index) {
    const transformStyle = `transform: rotate(${img.rotation}deg) scale(${img.scale});`;
    
    return $(`
      <div class="col-md-4 col-lg-3 image-item" data-index="${index}" data-id="${img.id}">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center p-2">
            <small class="text-muted">${img.name}</small>
            <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-index="${index}">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="card-body p-2 text-center">
            <img src="${img.src}" class="img-fluid mb-2" style="${transformStyle}" alt="Imagen ${index + 1}">
            
            <div class="mb-2">
              <label class="form-label small">Rotación: <span class="rotation-value">${img.rotation}°</span></label>
              <input type="range" class="form-range rotation-slider" min="0" max="360" step="90" 
                     value="${img.rotation}" data-index="${index}">
              <div class="btn-group w-100 mt-1">
                <button type="button" class="btn btn-sm btn-outline-secondary rotate-btn" 
                        data-index="${index}" data-rotation="-90">
                  <i class="bi bi-arrow-counterclockwise"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary rotate-btn" 
                        data-index="${index}" data-rotation="90">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            
            <div class="mb-2">
              <label class="form-label small">Escala: <span class="scale-value">${Math.round(img.scale * 100)}%</span></label>
              <input type="range" class="form-range scale-slider" min="0.1" max="2" step="0.1" 
                     value="${img.scale}" data-index="${index}">
            </div>
            
            <button type="button" class="btn btn-sm btn-outline-primary reset-btn w-100" data-index="${index}">
              <i class="bi bi-arrow-clockwise"></i> Resetear
            </button>
          </div>
        </div>
      </div>
    `);
  }

  // Inicializar sortable
  function initializeSortable() {
    if (sortableInstance) {
      sortableInstance.destroy();
    }
    
    const container = document.getElementById('imagePreviewContainer');
    if (container && typeof Sortable !== 'undefined') {
      sortableInstance = new Sortable(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: function(evt) {
          const oldIndex = evt.oldIndex;
          const newIndex = evt.newIndex;
          
          if (oldIndex !== newIndex) {
            const movedItem = imageData.splice(oldIndex, 1)[0];
            imageData.splice(newIndex, 0, movedItem);
            renderImagePreviews();
          }
        }
      });
    }
  }

  // Manejar cambio de rotación
  function handleRotationChange(e) {
    const index = parseInt($(e.target).data('index'));
    const rotation = parseInt($(e.target).val());
    
    if (imageData[index]) {
      imageData[index].rotation = rotation;
      updateImagePreview(index);
    }
  }

  // Manejar cambio de escala
  function handleScaleChange(e) {
    const index = parseInt($(e.target).data('index'));
    const scale = parseFloat($(e.target).val());
    
    if (imageData[index]) {
      imageData[index].scale = scale;
      updateImagePreview(index);
    }
  }

  // Manejar botón de rotación
  function handleRotateButton(e) {
    const index = parseInt($(e.target).closest('.rotate-btn').data('index'));
    const rotation = parseInt($(e.target).closest('.rotate-btn').data('rotation'));
    
    if (imageData[index]) {
      imageData[index].rotation = (imageData[index].rotation + rotation) % 360;
      if (imageData[index].rotation < 0) {
        imageData[index].rotation += 360;
      }
      updateImagePreview(index);
    }
  }

  // Actualizar vista previa de imagen
  function updateImagePreview(index) {
    const img = imageData[index];
    const $card = $(`.image-item[data-index="${index}"]`);
    
    // Actualizar imagen
    const transformStyle = `transform: rotate(${img.rotation}deg) scale(${img.scale});`;
    $card.find('img').attr('style', transformStyle);
    
    // Actualizar valores mostrados
    $card.find('.rotation-value').text(img.rotation + '°');
    $card.find('.scale-value').text(Math.round(img.scale * 100) + '%');
    
    // Actualizar sliders
    $card.find('.rotation-slider').val(img.rotation);
    $card.find('.scale-slider').val(img.scale);
  }

  // Resetear imagen individual
  function handleResetImage(e) {
    const index = parseInt($(e.target).closest('.reset-btn').data('index'));
    
    if (imageData[index]) {
      imageData[index].rotation = 0;
      imageData[index].scale = 1.0;
      updateImagePreview(index);
    }
  }

  // Eliminar imagen
  function handleDeleteImage(e) {
    const index = parseInt($(e.target).closest('.delete-btn').data('index'));
    
    if (imageData[index]) {
      imageData.splice(index, 1);
      renderImagePreviews();
      
      if (imageData.length === 0) {
        hideControlButtons();
      }
    }
  }

  // Resetear todas las imágenes
  function resetAllImages() {
    imageData.forEach(img => {
      img.rotation = 0;
      img.scale = 1.0;
    });
    renderImagePreviews();
  }

  // Limpiar todas las imágenes
  function clearAllImages() {
    if (confirm('¿Estás seguro de que quieres eliminar todas las imágenes?')) {
      imageData = [];
      $('#imagePreviewContainer').parent().remove();
      hideControlButtons();
      $('#images').val('');
    }
  }

  // Manejar envío del formulario
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (imageData.length === 0) {
      showMessage('Por favor selecciona al menos una imagen.', 'warning');
      return;
    }

    const $btn = $('#btn_cnv_img2pdf');
    const originalText = $btn.html();
    
    $btn.prop('disabled', true).html('<i class="bi bi-hourglass-split"></i> Procesando...');
    
    try {
      await generatePDF();
      showMessage('PDF generado exitosamente.', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showMessage('Error al generar el PDF.', 'danger');
    } finally {
      $btn.prop('disabled', false).html(originalText);
    }
  }

  // Generar PDF
  async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    for (let i = 0; i < imageData.length; i++) {
      const imgInfo = imageData[i];
      
      // Crear canvas para aplicar transformaciones
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.src = imgInfo.src;
      
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      // Calcular dimensiones con rotación y escala
      const radians = (imgInfo.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      
      const scaledWidth = img.width * imgInfo.scale;
      const scaledHeight = img.height * imgInfo.scale;
      
      const rotatedWidth = scaledWidth * cos + scaledHeight * sin;
      const rotatedHeight = scaledWidth * sin + scaledHeight * cos;
      
      canvas.width = rotatedWidth;
      canvas.height = rotatedHeight;
      
      // Aplicar transformaciones
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.scale(imgInfo.scale, imgInfo.scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      // Obtener datos de imagen transformada
      const transformedImageData = canvas.toDataURL('image/JPEG', 0.8);
      
      // Calcular tamaño para PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let pdfWidth = canvas.width * 0.264583; // px to mm
      let pdfHeight = canvas.height * 0.264583;
      
      // Ajustar al tamaño de página manteniendo proporción
      const ratio = Math.min(
        (pageWidth - 20) / pdfWidth,
        (pageHeight - 20) / pdfHeight
      );
      
      if (ratio < 1) {
        pdfWidth *= ratio;
        pdfHeight *= ratio;
      }
      
      // Centrar en la página
      const x = (pageWidth - pdfWidth) / 2;
      const y = (pageHeight - pdfHeight) / 2;
      
      if (i > 0) pdf.addPage();
      pdf.addImage(transformedImageData, 'JPEG', x, y, pdfWidth, pdfHeight);
    }
    
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    $('#btn_dl_img2pdf').show().attr('href', url);
  }

  // Manejar descarga
  function handleDownload() {
    setTimeout(() => {
      window.close();
    }, 500);
  }

  // Mostrar botones de control
  function showControlButtons() {
    $('#btn_cnv_img2pdf').show();
  }

  // Ocultar botones de control
  function hideControlButtons() {
    $('#btn_cnv_img2pdf').hide();
    $('#btn_dl_img2pdf').hide();
  }

  // Mostrar progreso
  function showProgress() {
    // Implementar barra de progreso si es necesario
    console.log('Procesando imágenes...');
  }

  // Actualizar progreso
  function updateProgress(percent) {
    console.log(`Progreso: ${percent}%`);
  }

  // Ocultar progreso
  function hideProgress() {
    console.log('Procesamiento completado');
  }

  // Mostrar mensaje
  function showMessage(message, type) {
    const $message = $('#message');
    $message.removeClass('alert-success alert-warning alert-danger alert-info')
            .addClass(`alert-${type}`)
            .html(`<button type="button" class="btn-close" data-bs-dismiss="alert"></button>${message}`)
            .show();
  }

  // Cargar textos (mantener función original)
  function loadTexts() {
    ["btn_cnv_img2pdf","title_img2pdf","description_img2pdf","btn_dl_img2pdf"].forEach(element => {
      if (typeof setText === 'function') {
        setText(element);
      }
    });
  }

  // Cargar scripts externos (mantener función original)
  function loadExternalScripts() {
    const scripts = [
      "/scripts/bootstrap.bundle.5.3.6.min.js",
      "/scripts/lottie-web.5.13.0.min.js",
      "/scripts/menu.js",
      "/scripts/jspdf.umd.3.0.1.min.js",
      "/scripts/background.js",
    ];

    scripts.forEach(src => {
      const script = document.createElement("script");
      Object.assign(script, { src, async: false });
      document.head.appendChild(script);
    });
  }

  // Inicializar aplicación
  initializeApp();
});