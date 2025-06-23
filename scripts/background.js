$('#a_cnv_img2pdf').on('click', async function(e) {
  chrome.windows.create({
    url: chrome.runtime.getURL("/views/cnv_img2pdf.html"),
    type: "popup",
    width: 600,
    height: 700
  });
});

/*
  chrome.downloads.download({
    url: url,
    filename: filename, // Solo el nombre, sin ruta
    saveAs: false,
    conflictAction: 'overwrite'
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      alert('Error al descargar: ' + chrome.runtime.lastError.message);
      return;
    }

    chrome.downloads.onChanged.addListener(function deltaListener(delta) {
      if (delta.id === downloadId && delta.state?.current === "complete") {
        chrome.downloads.search({ id: downloadId }, function(results) {
          if (results && results.length > 0 && results[0].filename) {
            const absolutePath = results[0].filename;
            navigator.clipboard.writeText(absolutePath)
              .then(() => {
                console.log("Ruta copiada: " + absolutePath);
              })
              .catch(err => {
                console.error("Error copiando ruta:", err);
                alert('Error copiando ruta al portapapeles');
              });
            chrome.downloads.onChanged.removeListener(deltaListener); // Limpieza
          } else {
            alert("No se pudo obtener la ruta del archivo.");
          }
        });
      }
    });
  });
//*/