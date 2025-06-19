$('#a_cnv_img2pdf').on('click', async function(e) {
  chrome.windows.create({
    url: chrome.runtime.getURL("/views/cnv_img2pdf.html"),
    type: "popup",
    width: 600,
    height: 700
  });
});