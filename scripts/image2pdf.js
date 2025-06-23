document.addEventListener("DOMContentLoaded", function () {
  $('#imageToPdfForm').on('submit', async function(e) {
    e.preventDefault();
    const files = $('#images')[0].files;
    if (!files.length) return;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imgData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        });

        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let width = img.width;
        let height = img.height;

        // Ajustar tamaño manteniendo la relación de aspecto
        if (width > pageWidth || height > pageHeight) {
          const ratio = Math.min(pageWidth / width, pageHeight / height);
          width *= ratio;
          height *= ratio;
        }

        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
      }

      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      $('#btn_dl_img2pdf').show().attr('href', url);
    }
    catch (error) {
      console.error('Error al procesar imágenes:', error);
    }
  });

  $('#btn_dl_img2pdf').on('click', () => {
    // Espera medio segundo para asegurar que comience la descarga
    setTimeout(() => {
      window.close();
    }, 500);
  });

  ["btn_cnv_img2pdf","title_img2pdf","description_img2pdf","btn_dl_img2pdf"].forEach(element => {
    setText(element);
  });

  const scripts = [
    "/scripts/bootstrap.bundle.5.3.6.min.js",
    "/scripts/menu.js",
    "/scripts/jspdf.umd.3.0.1.min.js",
    "/scripts/background.js",
    "/scripts/image2pdf.js",
  ];

  scripts.forEach(src => {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  });

  probarSelectorArchivos((funciona) => {
    const main = $("#main");
    const fileInput = (main.length > 0) ? main[0] : null;
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    console.log('Archivo seleccionado:', file);
    if (!funciona) {
      console.warn("⚠️ El popup o script perdió el hilo al abrir el selector.");
      main.hide();
      chrome.windows.create({
        url: "/views/cnv_img2pdf.html",
        type: "popup",
        width: 600,
        height: 700
      });
    }
  });
});