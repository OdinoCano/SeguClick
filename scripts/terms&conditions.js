$(document).ready(function () {
  var storage = chrome.storage.local;

  loadChanges();

  $("#terms_form").on("click", function(e) {
    e.preventDefault();
    if ($("#accept_terms").is(":checked")) {
      saveChanges('t&c', {"date": new Date().toISOString(), 'userAgent': navigator.userAgent});
    }
  });

  function loadChanges() {
    storage.get('t&c', function(items) {
      if (items['t&c']) {
        window.location.href = "/views/qr.html";
      }
    });
  }

  function saveChanges(key, value) {
    storage.set({ [key]: value }, function() {
      window.location.href = "/views/qr.html";
    });
  }

  ["title_tnc", "description_tnc", "cb_accept_terms", "terms_form", "terms_content"].forEach(function(element) {
    setText(element);
  });

  const scripts = [
    "/scripts/bootstrap.bundle.5.3.6.min.js",
    "/scripts/lottie-web.5.13.0.min.js",
    "/scripts/menu.js",
  ];

  scripts.forEach(function(src) {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  });
});