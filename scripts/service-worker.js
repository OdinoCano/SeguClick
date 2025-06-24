let activeConnections = 0; // Contador de conexiones activas
let keepAliveInterval;

// Función para mantener vivo el Service Worker
function startPersistentMode() {
  if (keepAliveInterval) return;
  
  console.log("[Background] Entrando en modo persistente");
  keepAliveInterval = setInterval(() => {
    chrome.storage.local.set({ lastAliveCheck: Date.now() });
  }, 20000); // 20 segundos (menos que el timeout de 30s de Chrome)
}

function stopPersistentMode() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log("[Background] Modo persistente desactivado");
  }
}

// Escuchar conexiones de las ventanas de fallback
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "fallbackWindow") {
    activeConnections++;
    startPersistentMode();

    port.onDisconnect.addListener(() => {
      activeConnections--;
      if (activeConnections <= 0) stopPersistentMode();
      //if (activeConnections === 0) {
      //  stopPersistentMode();
      //}
    });
  }
});