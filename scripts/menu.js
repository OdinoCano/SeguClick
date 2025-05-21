const tldLocales = {
  '1': 'Inicio',
  '2': 'Perfil',
  '3': 'Configuración',
  '4': 'Salir'
}
$(function() {
  $(document).on('contextmenu', function(e) {
    e.preventDefault();
    $('#customContextMenu').css({
      display: 'block',
      left: e.pageX,
      top: e.pageY
    });
  });
  $(document).on('click', function() {
    $('#customContextMenu').hide();
  });
});