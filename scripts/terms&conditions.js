var storage = chrome.storage.local;

loadChanges();

$("#terms_form").on("click",(e)=>{
  e.preventDefault();
  if ($("#accept_terms").is(":checked")) {
    saveChanges('t&c', {"date":new Date().toISOString(),'userAgent': navigator.userAgent});
  }
})

function loadChanges() {
  storage.get('t&c', function(items) {
    if (items['t&c']) {
      window.location.href = "/views/qr.html";
    }
  });
}

function saveChanges(key, value) {
  storage.set({ [key] : value}, function() {
    window.location.href = "/views/qr.html";
  });
}

["title_tnc","description_tnc","cb_accept_terms","terms_form","terms_content"].forEach(element => {
    setText(element); 
});