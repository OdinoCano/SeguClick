document.addEventListener("DOMContentLoaded", function () {
  // Configuración inicial
  const CONFIG = {
    scripts: [
      "/scripts/bootstrap.bundle.5.3.6.min.js",
      "/scripts/lottie-web.5.13.0.min.js",
      "/scripts/menu.js",
    ],
    lang: chrome.i18n.getUILanguage(),
    isMexico: chrome.i18n.getUILanguage() === 'es-MX',
    apis: {
      sepomex: 'https://sepomex.icalialabs.com/api/v1',
      zippopotam: 'https://api.zippopotam.us'
    },
    selectors: {
      country: '#cntry_pc',
      state: '#st_pc',
      city: '#cty_pc',
      colony: '#col_pc',
      municipality: '#mun_pc',
      result: '#resultado',
      cpSelect: '#cp',
      searchBtn: '#search_btn_pc'
    }
  };

  // Carga de scripts optimizada
  CONFIG.scripts.forEach(src => {
    const script = document.createElement("script");
    Object.assign(script, { src, defer: true });
    document.head.appendChild(script);
  });

  // Configuración inicial de placeholders
  const initializePlaceholders = () => {
    setFirstOptionText("cntry_pc", "placeholder_cntry");
    setFirstOptionText("st_pc", "placeholder_st");
    setSelectPlaceholder("cty_pc", "placeholder_cty");
    setSelectPlaceholder("col_pc", "placeholder_col");
  };

  // Utilidades para manejo de elementos
  const ElementUtils = {
    showError: (selector, message) => {
      $(selector).html(`<option>Error: ${message}</option>`);
    },

    populateSelect: (selector, options, valueKey = 'value', textKey = 'text') => {
      const $select = $(selector);
      $select.empty();
      options.forEach(option => {
        const value = typeof option === 'object' ? option[valueKey] : option;
        const text = typeof option === 'object' ? option[textKey] : option;
        $select.append(`<option value="${value}">${text}</option>`);
      });
    },

    setResult: (message, isStrong = false) => {
      const content = isStrong ? `<strong>${message}</strong>` : message;
      $(CONFIG.selectors.result).html(content);
    }
  };

  // Manejadores de datos
  const DataHandlers = {
    async loadCountryData() {
      try {
        const response = await $.getJSON('/json/country.json');
        return response;
      } catch (error) {
        console.error('Error loading country data:', error);
        return null;
      }
    },

    async loadStatesForCountry(countryCode, countryData) {
      const states = countryData[countryCode]?.states || [];
      return states.map(state => ({
        value: state.code || state.num,
        text: state.name
      }));
    },

    async loadMunicipalities(stateId) {
      try {
        const response = await $.ajax({
          url: `${CONFIG.apis.sepomex}/states/${stateId}/municipalities`,
          method: 'GET',
          dataType: 'json'
        });
        return [...new Set(response.municipalities)];
      } catch (error) {
        console.error('Error loading municipalities:', error);
        return [];
      }
    }
  };

  // Inicialización específica por país
  const CountryInitializer = {
    async initializeForMexico() {
      $('#country_pc').parent().hide();
      
      const countryData = await DataHandlers.loadCountryData();
      if (!countryData) {
        ElementUtils.showError(CONFIG.selectors.state, 'Error al cargar países');
        return;
      }

      const states = await DataHandlers.loadStatesForCountry('mx', countryData);
      const $states = $(CONFIG.selectors.state);
      $states.html('<option value="">Selecciona un estado</option>');
      ElementUtils.populateSelect(CONFIG.selectors.state, states, 'value', 'text');
    },

    async initializeForOthers() {
      $("#municipality_pc").parent().hide();
      $("#or_pc").hide();

      const countryData = await DataHandlers.loadCountryData();
      if (!countryData) {
        ElementUtils.showError(CONFIG.selectors.country, 'Error al cargar países');
        return;
      }

      const countries = Object.entries(countryData).map(([code, country]) => ({
        value: code,
        text: country.name
      }));
      
      ElementUtils.populateSelect(CONFIG.selectors.country, countries, 'value', 'text');
    }
  };

  // Funciones de búsqueda
  const SearchHandlers = {
    async searchMexicoPostalCode() {
      const $resultado = $(CONFIG.selectors.result).html('');
      const colony = encodeURIComponent($(CONFIG.selectors.colony).val().trim());
      const city = encodeURIComponent($(CONFIG.selectors.city).val().trim());
      const state = encodeURIComponent($(`${CONFIG.selectors.state} option:selected`).text());
      
      const params = [];
      if (colony.length > 3) params.push(`colony=${colony}`);
      if (city.length > 3) params.push(`city=${city}`);
      if (state.length > 0) params.push(`state=${state}`);

      if (params.length === 0) {
        ElementUtils.setResult('Por favor ingresa al menos un criterio de búsqueda', true);
        return;
      }

      try {
        const response = await $.ajax({
          url: `${CONFIG.apis.sepomex}/zip_codes?${params.join('&')}`,
          method: 'GET',
          dataType: 'json'
        });

        const zipCodes = [...new Set(response.zip_codes)];
        this.handlePostalCodeResults(zipCodes);
      } catch (error) {
        ElementUtils.setResult('Error al buscar códigos postales', true);
      }
    },

    async searchInternationalPostalCode() {
      const countryCode = $(CONFIG.selectors.country).val();
      const stateCode = $(CONFIG.selectors.state).val();
      const city = encodeURIComponent($(CONFIG.selectors.city).val().trim());

      if (!countryCode || !stateCode || !city) {
        ElementUtils.setResult('Por favor completa todos los campos', true);
        return;
      }

      ElementUtils.setResult('Buscando códigos postales...');

      try {
        const response = await $.ajax({
          url: `${CONFIG.apis.zippopotam}/${countryCode}/${stateCode}/${city}`,
          method: 'GET',
          dataType: 'json'
        });

        const postCodes = [...new Set(response.places.map(p => p['post code']))];
        const formattedCodes = postCodes.map(pc => {
          const place = response.places.find(p => p['post code'] === pc);
          return {
            d_codigo: pc,
            d_asenta: place ? place['place name'] : '',
            d_tipo_asenta: 'Lugar'
          };
        });

        this.handlePostalCodeResults(formattedCodes);
      } catch (error) {
        const msg = error.status === 404 ? 'No se encontraron códigos postales' : 'Error al consultar códigos postales';
        ElementUtils.setResult(msg, true);
      }
    },

    handlePostalCodeResults(zipCodes) {
      if (zipCodes.length === 0) {
        ElementUtils.setResult('No hay códigos postales con los datos proporcionados', true);
        return;
      }

      if (zipCodes.length === 1) {
        ElementUtils.setResult(`C.P.: ${zipCodes[0].d_codigo}`, true);
        return;
      }

      const $cpSelect = $(CONFIG.selectors.cpSelect);
      $cpSelect.prop('hidden', false).html('<option value="">Selecciona una opción</option>');
      
      zipCodes.forEach(item => {
        const text = item.d_tipo_asenta && item.d_asenta 
          ? `${item.d_tipo_asenta}: ${item.d_asenta}`
          : item.d_asenta || item.d_codigo;
        $cpSelect.append(`<option value="${item.d_codigo}">${text}</option>`);
      });
    }
  };

  // Event Handlers
  const EventHandlers = {
    setupEventListeners() {
      // Evento de cambio de código postal
      $(CONFIG.selectors.cpSelect).on('change', function() {
        $(this).prop('hidden', true);
        ElementUtils.setResult(`C.P.: ${$(this).val()}`, true);
      });

      // Evento de cambio de municipio (solo México)
      $('#mun_pc').on('change', function() {
        const pcSeleccionado = $(this).find('option:selected').data('pc');
        const message = pcSeleccionado 
          ? `C.P. aproximado: ${pcSeleccionado}`
          : 'No hay C.P. seleccionado en el municipio.';
        ElementUtils.setResult(message, true);
      });

      // Evento de cambio de país
      $(CONFIG.selectors.country).on('change', async function() {
        const countryCode = $(this).val();
        const $state = $(CONFIG.selectors.state);

        $state.prop('disabled', !countryCode);
        if (!countryCode) return;

        $state.html('').prop('disabled', true);
        setFirstOptionText("st_pc", "placeholder_st");

        const countryData = await DataHandlers.loadCountryData();
        if (countryData) {
          const states = await DataHandlers.loadStatesForCountry(countryCode, countryData);
          ElementUtils.populateSelect(CONFIG.selectors.state, states, 'value', 'text');
        } else {
          ElementUtils.showError(CONFIG.selectors.state, 'Error loading states');
        }
        $state.prop('disabled', false);
      });

      // Evento de cambio de estado (solo México)
      $(CONFIG.selectors.state).on('change', async function() {
        if (!CONFIG.isMexico) return;

        const stateId = $(this).val();
        const $municipality = $('#mun_pc');
        
        if (!stateId) return;

        $municipality.html('<option>Cargando...</option>');
        const municipalities = await DataHandlers.loadMunicipalities(stateId);
        
        if (municipalities.length === 0) {
          $municipality.html('<option>No hay municipios</option>');
          return;
        }

        $municipality.html('<option value="">Selecciona un municipio</option>');
        municipalities.forEach(m => {
          $municipality.append(`<option value="${m.id}" data-pc="${m.zip_code}">${m.name}</option>`);
        });
      });

      // Evento de búsqueda
      $(CONFIG.selectors.searchBtn).on('click', function() {
        if (CONFIG.isMexico) {
          SearchHandlers.searchMexicoPostalCode();
        } else {
          SearchHandlers.searchInternationalPostalCode();
        }
      });
    }
  };

  // Inicialización principal
  const initialize = async () => {
    initializePlaceholders();
    
    if (CONFIG.isMexico) {
      await CountryInitializer.initializeForMexico();
    } else {
      await CountryInitializer.initializeForOthers();
    }

    EventHandlers.setupEventListeners();

    // Configurar textos de internacionalización
    [
      "title_pc", "country_pc", "state_pc", "city_pc", "colony_pc",
      "or_pc", "municipality_pc", "search_btn_pc"
    ].forEach(setText);
  };

  // Ejecutar inicialización
  initialize();
});