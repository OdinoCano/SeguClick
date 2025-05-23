$('#watermarkBtn').on('click', async function () {
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
      const text = "PRE-POLISA";
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

    $('#downloadLink').attr('href', url).show();
  };

  reader.readAsArrayBuffer(file);
});