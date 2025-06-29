document.addEventListener("DOMContentLoaded", function () {
  // Verificar si estamos en una ventana de fallback
  const isFallbackWindow = window.location.search.includes('fallback=true');
  
  // Elemento principal
  const main = $("#main");

  // Solo ejecutar la prueba si NO estamos en una ventana de fallback
  /*
  if (!isFallbackWindow) {
    console.log("🚀 Iniciando verificación de contexto...");
    
    probarSelectorArchivos((funciona) => {
      console.log(funciona)
      if (funciona) {
        console.log("✅ Contexto funcional - continuando en ventana actual");
        // El contexto funciona, continuar normalmente
        main.show();
      } else {
        console.warn("⚠️ Contexto perdido confirmado. Creando ventana segura...");
        main.hide();
        
        // Crear nueva ventana con marca de fallback
        chrome.windows.create({
          url: chrome.runtime.getURL("/views/cnv_img2pdf.html") + "?fallback=true",
          type: "popup",
          width: 600,
          height: 700,
          left: Math.floor((screen.width - 600) / 2), // Centrar mejor
          top: Math.floor((screen.height - 700) / 2)
        }, (newWindow) => {
          if (newWindow) {
            console.log("🆕 Ventana de fallback creada:", newWindow.id);
            
            // Conectar al background script para mantenerlo activo
            const port = chrome.runtime.connect({ name: "fallbackWindow" });
            
            // Cuando esta ventana se cierre, desconectar
            window.addEventListener("beforeunload", () => {
              port.disconnect();
            });
            
            // Cerrar la ventana actual después de un momento
            setTimeout(() => {
              window.close();
            }, 1000);
          }
        });
      }
    });
  }//*/

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
    "/scripts/lottie-web.5.13.0.min.js",
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
});