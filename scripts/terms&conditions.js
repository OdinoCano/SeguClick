var storage = chrome.storage.local;

loadChanges();

$("#termsForm").on("click",(e)=>{
  e.preventDefault();
  if ($("#acceptTerms").is(":checked")) {
    saveChanges('t&c', {"date":new Date().toISOString(),'userAgent': navigator.userAgent});
  }
})

function loadChanges() {
  storage.get('t&c', function(items) {
    if (items['t&c']) {
      window.location.href = "/views/img2pdf.html";
    }
  });
}

function saveChanges(key, value) {
  storage.set({ [key] : value}, function() {
    window.location.href = "/views/img2pdf.html";
  });
}