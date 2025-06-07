$('#imageToPdfForm').on('submit', async function(e) {
    e.preventDefault();
    const files = $('#images')[0].files;
    if (!files.length) return;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

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
});

["btn_cnv_img2pdf","title_img2pdf","description_img2pdf","btn_dl_img2pdf"].forEach(element => {
    setText(element);
});