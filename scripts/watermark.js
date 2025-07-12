class WatermarkProcessor {
    constructor() {
      this.files = new Map();
      this.processedFiles = new Map();
      this.isProcessing = false;
      this.init();
    }
    init() {
      this.setupEventListeners();
      this.updateRangeValues();
    }
    setupEventListeners() {
      // Drag and drop
      const $dropZone = $('#dropZone');
      const $fileInput = $('#pdfInput');
      $dropZone.on('click', function(e) {
        if (e.target !== $fileInput[0]) {
          $fileInput.click();
        }
      });
      
      $dropZone.on('dragover', (e) => {
        e.preventDefault();
        $dropZone.addClass('dragover');
      });
      
      $dropZone.on('dragleave', () => {
        $dropZone.removeClass('dragover');
      });
      
      $dropZone.on('drop', (e) => {
        e.preventDefault();
        $dropZone.removeClass('dragover');
        const files = Array.from(e.originalEvent.dataTransfer.files);
        this.handleFiles(files);
      });
      // File input
      $('#pdfInput').on('change', (e) => {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
      });
      // Range inputs
      $('#fontSize').on('input', this.updateRangeValues);
      $('#opacity').on('input', this.updateRangeValues);
      $('#rotation').on('input', this.updateRangeValues);
      // Buttons
      $('#btn_cnv_wmk').on('click', () => this.processAllFiles());
      $('#btn_dl_all').on('click', () => this.downloadAllFiles());
      $('#btn_clear').on('click', () => this.clearAllFiles());
    }
    updateRangeValues() {
      $('#fontSizeValue').text($('#fontSize').val());
      $('#opacityValue').text($('#opacity').val());
      $('#rotationValue').text($('#rotation').val());
    }
    handleFiles(files) {
      const pdfFiles = files.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length === 0) {
        alert('Por favor selecciona solo archivos PDF válidos');
        return;
      }
      pdfFiles.forEach(file => {
        if (!this.files.has(file.name)) {
          this.files.set(file.name, file);
          this.addFileToList(file);
        }
      });
      this.updateUI();
    }
    addFileToList(file) {
      const fileId = this.generateFileId(file.name);
      const fileSize = this.formatFileSize(file.size);
      
      const fileItem = $(`
        <div class="file-item" data-file-id="${fileId}">
          <div class="d-flex justify-content-between align-items-center">
            <div class="flex-grow-1">
              <h6 class="mb-1">${file.name}</h6>
              <small class="text-muted">${fileSize}</small>
            </div>
            <div class="d-flex align-items-center">
              <span class="badge bg-secondary me-2 status-badge">Pendiente</span>
              <button class="btn btn-sm btn-outline-primary me-2 process-single" data-file-name="${file.name}">
                <i class="bi bi-magic"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger remove-file" data-file-name="${file.name}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <div class="progress-container">
            <div class="progress">
              <div class="progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
          </div>
        </div>
      `);
      // Event listeners for individual file actions
      fileItem.find('.process-single').on('click', () => this.processFile(file.name));
      fileItem.find('.remove-file').on('click', () => this.removeFile(file.name));
      $('#fileList').append(fileItem);
    }
    async processFile(fileName) {
      const file = this.files.get(fileName);
      if (!file || this.isProcessing) return;
      const watermarkText = $('#watermarkText').val().trim();
      if (!watermarkText) {
        alert('Por favor ingresa un texto para la marca de agua');
        return;
      }
      const fileItem = $(`.file-item[data-file-id="${this.generateFileId(fileName)}"]`);
      const statusBadge = fileItem.find('.status-badge');
      const progressContainer = fileItem.find('.progress-container');
      const progressBar = fileItem.find('.progress-bar');
      try {
        // Update UI
        fileItem.addClass('processing');
        statusBadge.removeClass('bg-secondary bg-success bg-danger').addClass('bg-warning').text('Procesando...');
        progressContainer.show();
        progressBar.css('width', '20%');
        // Read file
        const arrayBuffer = await this.readFileAsArrayBuffer(file);
        progressBar.css('width', '40%');
        // Process PDF
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        progressBar.css('width', '60%');
        const pages = pdfDoc.getPages();
        const fontSize = parseInt($('#fontSize').val());
        const opacity = parseFloat($('#opacity').val());
        const rotation = parseInt($('#rotation').val());
        pages.forEach(page => {
          const { width, height } = page.getSize();
          const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = helveticaFont.heightAtSize(fontSize);
          const radians = Math.PI / (180 / rotation);
          const x = (width / 2) - (textWidth / 2) * Math.cos(radians);
          const y = (height / 2) - (textHeight * 3) * Math.sin(radians);
          page.drawText(watermarkText, {
            x: x,
            y: y,
            size: fontSize,
            font: helveticaFont,
            color: PDFLib.rgb(0.58, 0.58, 0.58),
            rotate: PDFLib.degrees(rotation),
            opacity: opacity
          });
        });
        progressBar.css('width', '80%');
        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        // Store processed file
        this.processedFiles.set(fileName, {
          blob: blob,
          url: url,
          originalName: fileName
        });
        progressBar.css('width', '100%');
        // Update UI
        fileItem.removeClass('processing').addClass('completed');
        statusBadge.removeClass('bg-warning').addClass('bg-success').text('Completado');
        
        // Add download button
        const downloadBtn = $(`
          <a href="${url}" download="${this.getProcessedFileName(fileName)}" 
             class="btn btn-sm btn-success me-2">
            <i class="bi bi-download"></i>
          </a>
        `);
        fileItem.find('.process-single').replaceWith(downloadBtn);
        this.updateUI();
      } catch (error) {
        console.error('Error processing file:', error);
        fileItem.removeClass('processing').addClass('error');
        statusBadge.removeClass('bg-warning').addClass('bg-danger').text('Error');
        progressContainer.hide();
        alert(`Error al procesar ${fileName}: ${error.message}`);
      }
    }
    async processAllFiles() {
      console.log('A');
      if (this.isProcessing || this.files.size === 0) return;
      console.log('B');
      const watermarkText = $('#watermarkText').val().trim();
      if (!watermarkText) {
        alert('Por favor ingresa un texto para la marca de agua');
        return;
      }
      this.isProcessing = true;
      $('#btn_cnv_wmk').prop('disabled', true);
      $('#globalProgress').show();
      const fileNames = Array.from(this.files.keys());
      let completedCount = 0;
      for (const fileName of fileNames) {
        if (!this.processedFiles.has(fileName)) {
          await this.processFile(fileName);
        }
        completedCount++;
        
        const progress = (completedCount / fileNames.length) * 100;
        $('#globalProgress .progress-bar').css('width', `${progress}%`);
      }
      this.isProcessing = false;
      $('#btn_cnv_wmk').prop('disabled', false);
      $('#globalProgress').hide();
      this.updateUI();
    }
    downloadAllFiles() {
      if (this.processedFiles.size === 0) return;
      this.processedFiles.forEach((fileData, fileName) => {
        const link = document.createElement('a');
        link.href = fileData.url;
        link.download = this.getProcessedFileName(fileName);
        link.click();
      });
    }
    removeFile(fileName) {
      this.files.delete(fileName);
      if (this.processedFiles.has(fileName)) {
        URL.revokeObjectURL(this.processedFiles.get(fileName).url);
        this.processedFiles.delete(fileName);
      }
      
      $(`.file-item[data-file-id="${this.generateFileId(fileName)}"]`).remove();
      this.updateUI();
    }
    clearAllFiles() {
      // Revoke all URLs
      this.processedFiles.forEach(fileData => {
        URL.revokeObjectURL(fileData.url);
      });
      
      this.files.clear();
      this.processedFiles.clear();
      $('#fileList').empty();
      $('#pdfInput').val('');
      this.updateUI();
    }
    updateUI() {
      const fileCount = this.files.size;
      const processedCount = this.processedFiles.size;
      
      $('#fileCount').text(fileCount);
      $('#filesCard').toggle(fileCount > 0);
      $('#btn_dl_all').toggle(processedCount > 0);
      
      if (fileCount === 0) {
        $('#globalProgress').hide();
      }
    }
    // Utility methods
    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }
    generateFileId(fileName) {
      return fileName.replace(/[^a-zA-Z0-9]/g, '_');
    }
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    getProcessedFileName(originalName) {
      const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
      return `${nameWithoutExt}_watermarked.pdf`;
    }
}

// Initialize when document is ready
$(document).ready(function() {
  new WatermarkProcessor();
  const scripts = [
    "/scripts/bootstrap.bundle.5.3.6.min.js",
    "/scripts/lottie-web.5.13.0.min.js",
    "/scripts/menu.js",
    "/scripts/pdf-lib.1.17.1.min.js"
  ];
  scripts.forEach(src => {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  });
  // Mantener compatibilidad con el sistema de traducción existente
  if (typeof setText === 'function') {
    [
      "title_wmk", "description_wmk", "txt_wmk", "btn_cnv_wmk", "btn_dl_wmk"
    ].forEach(element => {
      setText(element);
    });
  }
  if (typeof setInputPlaceholder === 'function') {
    setInputPlaceholder("txt_wmk", "txt_wmk");
  }
});
$('#btn_cnv_wmk').on('click', async function () {
  const file = $('#pdfInput')[0].files[0];
  if (!file) return alert("Selecciona un archivo PDF");
  const reader = new FileReader();
  reader.onload = async function () {
    const existingPdfBytes = new Uint8Array(reader.result);
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      const text = $("#watermarkText").val().trim();
      const fontSize = 78;
      const grades = 45;
      // Medir texto para centrarlo
      const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
      const textHeight = helveticaFont.heightAtSize(fontSize);
      // Coordenadas ajustadas para rotación
      const radians = Math.PI / (180/grades);
      const x = (width / 2) - (textWidth / 2) * Math.cos(radians);
      const y = (height / 2) - (textHeight * 3) * Math.sin(radians);
      page.drawText(text, {
        x: x,
        y: y,
        size: fontSize,
        font: helveticaFont,
        color: PDFLib.rgb(0.58, 0.58, 0.58),
        rotate: PDFLib.degrees(grades),
        opacity: 0.3
      });
    });
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    $('#btn_dl_wmk').attr('href', url).show();
  };
  reader.readAsArrayBuffer(file);
});