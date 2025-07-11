$(document).ready(function() {
  const $menuContainer = $("#menu-container");
  if (!$menuContainer.length) return;

  // Configuración de animaciones
  const animationConfigs = [
    { id: 'img2pdf_ico', path: '/json/img2pdf.json' },
    { id: 'utr_ico', path: '/json/utr.json' },
    { 
      id: 'qr_ico', 
      path: '/json/qr_white.json',
      rendererSettings: {
        scaleMode: 'noScale',
        preserveAspectRatio: 'xMidYMid meet',
        clearCanvas: false,
        progressiveLoad: false,
        hideOnTransparent: true
      },
      customStyles: {
        transformOrigin: 'top left',
        width: '48px',
        height: '48px'
      }
    },
    { id: 'pc_ico', path: '/json/pc.json' },
    { id: 'watermark_ico', path: '/json/watermark.json' },
    { id: 'comments_ico', path: '/json/comments.json' },
    { id: 'donate_ico', path: '/json/donate.json' }
  ];

  // Función para crear animación
  function createAnimation(config) {
    const element = document.getElementById(config.id);
    if (!element) {
      console.warn(`No se encontró #${config.id} después de cargar el menú`);
      return;
    }

    const animation = lottie.loadAnimation({
      container: element,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: config.path,
      ...(config.rendererSettings && { rendererSettings: config.rendererSettings })
    });

    // Aplicar estilos personalizados si existen
    if (config.customStyles) {
      Object.assign(element.style, config.customStyles);
    }

    // Agregar eventos
    element.addEventListener('mouseenter', () => animation.play());
    element.addEventListener('mouseleave', () => animation.stop());
  }

  // Cargar menú y configurar animaciones
  $.get("menu.html")
    .done(function(data) {
      $menuContainer.html(data);
      animationConfigs.forEach(createAnimation);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      console.error("Error al cargar el menú:", errorThrown, jqXHR, textStatus);
    });
});