document.addEventListener("DOMContentLoaded", function () {
  [
    "btn_dnt", "link_dnt"
  ].forEach(element => {
      setText(element);
  });

  const scripts = [
    "/scripts/bootstrap.bundle.5.3.6.min.js",
    "/scripts/lottie-web.5.13.0.min.js",
    "/scripts/menu.js",
  ];

  scripts.forEach(src => {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  });
});