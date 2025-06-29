$(document).ready(async function () {
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

  [
    "title_wmk","description_wmk","txt_wmk","btn_cnv_wmk","btn_dl_wmk"
  ].forEach(element => {
      setText(element);
  });
  setInputPlaceholder("txt_wmk","txt_wmk");
});