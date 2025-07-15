document.addEventListener("DOMContentLoaded", function () {
  // Configuración centralizada
  const CONFIG = {
    storage: chrome.storage.local,
    storageKey: 't&c',
    redirectUrl: '/views/img2pdf.html',
    scripts: [
      "/scripts/bootstrap.bundle.5.3.6.min.js",
      "/scripts/lottie-web.5.13.0.min.js",
      "/scripts/menu.js",
    ],
    i18nElements: [
      "title_tnc", "description_tnc", "cb_accept_terms", 
      "terms_form", "terms_content"
    ],
    selectors: {
      form: "#terms_form",
      checkbox: "#accept_terms"
    }
  };

  // Utilidades para manejo de almacenamiento
  const StorageUtils = {
    async get(key) {
      return new Promise((resolve) => {
        CONFIG.storage.get(key, (items) => {
          resolve(items[key] || null);
        });
      });
    },

    async set(key, value) {
      return new Promise((resolve) => {
        CONFIG.storage.set({ [key]: value }, resolve);
      });
    },

    createAcceptanceRecord() {
      return {
        date: new Date().toISOString(),
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };
    }
  };

  // Utilidades para navegación
  const NavigationUtils = {
    redirectTo(url) {
      window.location.href = url;
    },

    redirectToMain() {
      this.redirectTo(CONFIG.redirectUrl);
    }
  };

  // Utilidades para carga de scripts
  const ScriptLoader = {
    loadScripts(scripts) {
      scripts.forEach(src => {
        const script = document.createElement("script");
        Object.assign(script, { src, defer: true });
        document.head.appendChild(script);
      });
    }
  };

  // Utilidades para internacionalización
  const I18nUtils = {
    loadTexts(elements) {
      elements.forEach(setText);
    }
  };

  // Manejadores principales
  const TermsHandlers = {
    async checkExistingAcceptance() {
      const existingAcceptance = await StorageUtils.get(CONFIG.storageKey);
      
      if (existingAcceptance) {
        console.log('Terms already accepted:', existingAcceptance);
        NavigationUtils.redirectToMain();
        return true;
      }
      
      return false;
    },

    async handleFormSubmission(event) {
      event.preventDefault();
      
      const isAccepted = $(CONFIG.selectors.checkbox).is(":checked");
      
      if (!isAccepted) {
        console.warn('Terms not accepted');
        return;
      }

      try {
        const acceptanceRecord = StorageUtils.createAcceptanceRecord();
        await StorageUtils.set(CONFIG.storageKey, acceptanceRecord);
        
        console.log('Terms accepted and saved:', acceptanceRecord);
        NavigationUtils.redirectToMain();
      } catch (error) {
        console.error('Error saving terms acceptance:', error);
      }
    },

    setupEventListeners() {
      $(CONFIG.selectors.form).on("click", this.handleFormSubmission.bind(this));
    }
  };

  // Inicialización principal
  const initialize = async () => {
    try {
      // Cargar scripts
      ScriptLoader.loadScripts(CONFIG.scripts);
      
      // Cargar textos de internacionalización
      I18nUtils.loadTexts(CONFIG.i18nElements);
      
      // Verificar si ya se aceptaron los términos
      const alreadyAccepted = await TermsHandlers.checkExistingAcceptance();
      
      if (!alreadyAccepted) {
        // Configurar event listeners solo si no se han aceptado los términos
        TermsHandlers.setupEventListeners();
      }
      
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  };

  // Ejecutar inicialización
  initialize();
});