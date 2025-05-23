$(document).ready(function() {
  const $menuContainer = $("#menu-container");
  if ($menuContainer.length) {
    $.get("menu.html")
      .done(function(data) {
        $menuContainer.html(data);
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Error al cargar el menú:", errorThrown);
      });
  }
});