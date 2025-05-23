document.addEventListener("DOMContentLoaded", () => {
  const menuContainer = document.getElementById("menu-container");
  if (menuContainer) {
    fetch("menu.html") // relativo a la ubicación del HTML que lo llama
      .then(res => res.text())
      .then(data => {
        menuContainer.innerHTML = data;
      })
      .catch(err => console.error("Error al cargar el menú:", err));
  }
});