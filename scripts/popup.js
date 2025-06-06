const GITHUB_API_URL = "https://api.github.com/repos/OdinoCano/SeguClick/releases/latest";
const VERSION_CHECK_KEY = "lastTLSCheckDate";

function getTodayISO() {
  return new Date().toISOString().split("T")[0]; // formato YYYY-MM-DD
}

function checkForTLSUpdateOncePerDay() {
  const today = getTodayISO();

  chrome.storage.local.get(VERSION_CHECK_KEY, (data) => {
    const lastCheck = data[VERSION_CHECK_KEY];

    if (lastCheck === today) {
      console.log("Verificación TLS ya realizada hoy");
      return;
    }

    checkGitHubTLSUpdate().then(() => {
      chrome.storage.local.set({ [VERSION_CHECK_KEY]: today });
    });
  });
}

async function checkGitHubTLSUpdate() {
  const currentVersion = chrome.runtime.getManifest().version;

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: { "Accept": "application/vnd.github+json" },
    });

    if (!response.ok) throw new Error("No se pudo obtener el release");

    const data = await response.json();
    const latestTag = data.tag_name; // Ej: "tls-v1.3.0"
    if (!latestTag.startsWith("tls-v")) return;

    const latestVersion = latestTag.replace("tls-v", "");
    if (latestVersion !== currentVersion) {
      const changelog = data.body || "Nueva versión disponible.";
      const releaseUrl = data.html_url;

      if (confirm(`Versión TLS ${latestVersion} disponible:\n\n${changelog}\n\n¿Visitar release?`)) {
        window.open(releaseUrl, "_blank");
      }
    }
  } catch (err) {
    console.warn("Error al verificar versión TLS:", err);
  }
}

// Ejecutar al abrir la extensión
checkForTLSUpdateOncePerDay();
