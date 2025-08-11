$(function () {
  $.each(["btn_dnt", "link_dnt"], function (_, id) {
    i18nUtils.setText(id);
  });

  $.each([
    "am","ar","bg","bn","ca",
    "cs","da","de","el","en",
    "es"
  ], function (_, id) {
    i18nUtils.setAltTitle(id);
  });

  const scripts = [
    "/scripts/bootstrap.bundle.5.3.6.min.js",
    "/scripts/lottie-web.5.13.0.min.js",
    "/scripts/menu.js",
  ];

  scripts.forEach(src => {
    const script = document.createElement("script");
    Object.assign(script, { src, async: false });
    document.head.appendChild(script);
  });
});