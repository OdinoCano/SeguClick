$(document).ready(function () {
  const $loaderLottie = $('#loader_lottie');

  if ($loaderLottie.length) {
    const anim = lottie.loadAnimation({
      container: $loaderLottie[0],
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/json/loading.json' // tu animación
    });

    // Cuando el iframe carga, remueve el loader y destruye la animación
    $('iframe').on('load', function () {
      const $main = $(this).closest('main');

      // ✅ Oculta el loader neumórfico y destruye la animación
      $main.removeClass('loading');
      $main.find('.loader-circle').remove();   // 🔥 Esto remueve el círculo

      anim.destroy(); // Limpia el SVG y detiene Lottie
    });
  } else {
    console.warn('No se encontró #loader_lottie');
  }
});