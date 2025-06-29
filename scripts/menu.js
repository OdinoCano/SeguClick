//importar lottie-web.5.13.0.min.js
$(document).ready(function() {
  const $menuContainer = $("#menu-container");
  if ($menuContainer.length) {
    $.get("menu.html")
      .done(function(data) {
        $menuContainer.html(data);

        const $img2pdf = document.getElementById('img2pdf_ico');
        if ($img2pdf) {
          const anim1 = lottie.loadAnimation({
            container: $img2pdf,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/images/img2pdf.json' // the path to the animation json
          });
          // ▶️ Reproducir cuando pasa el cursor
          $img2pdf.addEventListener('mouseenter', () => {
            anim1.play();
          });

          // ⏹️ Detener cuando sale el cursor
          $img2pdf.addEventListener('mouseleave', () => {
            anim1.stop(); // o anim.goToAndStop(0, true); para reiniciar
          });
        } else {
          console.warn("No se encontró #img2pdf_ico después de cargar el menú");
        }
        const $utr = document.getElementById('utr_ico');
        if ($utr) {
          const anim2 = lottie.loadAnimation({
            container: $utr,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/images/utr.json' // the path to the animation json
          });
          // ▶️ Reproducir cuando pasa el cursor
          $utr.addEventListener('mouseenter', () => {
            anim2.play();
          });

          // ⏹️ Detener cuando sale el cursor
          $utr.addEventListener('mouseleave', () => {
            anim2.stop(); // o anim.goToAndStop(0, true); para reiniciar
          });
        } else {
          console.warn("No se encontró #utr_ico después de cargar el menú");
        }
        const $qr = document.getElementById('qr_ico');
        if ($qr) {
          const anim3 = lottie.loadAnimation({
            container: $qr,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/images/qr.json', // the path to the animation json
            rendererSettings: {
              scaleMode: 'noScale',
              preserveAspectRatio: 'xMidYMid meet',
              clearCanvas: false,
              progressiveLoad: false,
              hideOnTransparent: true
            }
          });
          $qr.style.transformOrigin = 'top left'; // o 'center' si prefieres centrar
          $qr.style.width = '48px';
          $qr.style.height = '48px';
          // ▶️ Reproducir cuando pasa el cursor
          $qr.addEventListener('mouseenter', () => {
            anim3.play();
          });

          // ⏹️ Detener cuando sale el cursor
          $qr.addEventListener('mouseleave', () => {
            anim3.stop(); // o anim.goToAndStop(0, true); para reiniciar
          });
        } else {
          console.warn("No se encontró #qr_ico después de cargar el menú");
        }
        const $pc = document.getElementById('pc_ico');
        if ($pc) {
          const anim4 = lottie.loadAnimation({
            container: $pc,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/images/pc.json' // the path to the animation json
          });
          // ▶️ Reproducir cuando pasa el cursor
          $pc.addEventListener('mouseenter', () => {
            anim4.play();
          });

          // ⏹️ Detener cuando sale el cursor
          $pc.addEventListener('mouseleave', () => {
            anim4.stop(); // o anim.goToAndStop(0, true); para reiniciar
          });
        } else {
          console.warn("No se encontró #pc_ico después de cargar el menú");
        }
        const $watermark = document.getElementById('watermark_ico');
        if ($watermark) {
          const anim5 = lottie.loadAnimation({
            container: $watermark,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/images/watermark.json' // the path to the animation json
          });
          // ▶️ Reproducir cuando pasa el cursor
          $watermark.addEventListener('mouseenter', () => {
            anim5.play();
          });

          // ⏹️ Detener cuando sale el cursor
          $watermark.addEventListener('mouseleave', () => {
            anim5.stop(); // o anim.goToAndStop(0, true); para reiniciar
          });
        } else {
          console.warn("No se encontró #watermark_ico después de cargar el menú");
        }
        const $comments = document.getElementById('comments_ico');
        if ($comments) {
          const anim6 = lottie.loadAnimation({
            container: $comments,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/images/comments.json' // the path to the animation json
          });
          // ▶️ Reproducir cuando pasa el cursor
          $comments.addEventListener('mouseenter', () => {
            anim6.play();
          });

          // ⏹️ Detener cuando sale el cursor
          $comments.addEventListener('mouseleave', () => {
            anim6.stop(); // o anim.goToAndStop(0, true); para reiniciar
          });
        } else {
          console.warn("No se encontró #comments_ico después de cargar el menú");
        }
        const $donate = document.getElementById('donate_ico');
        if ($donate) {
          const anim7 = lottie.loadAnimation({
            container: $donate,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/images/donate.json' // the path to the animation json
          });
          // ▶️ Reproducir cuando pasa el cursor
          $donate.addEventListener('mouseenter', () => {
            anim7.play();
          });

          // ⏹️ Detener cuando sale el cursor
          $donate.addEventListener('mouseleave', () => {
            anim7.stop(); // o anim.goToAndStop(0, true); para reiniciar
          });
        } else {
          console.warn("No se encontró #donate_ico después de cargar el menú");
        }
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Error al cargar el menú:", errorThrown);
        console.error(jqXHR);
        console.error(textStatus);
      });
  }
});