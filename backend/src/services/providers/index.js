const SportmonksAdapter = require('./sportmonksAdapter');

/**
 * Factory per provider adapter - punto di accesso unificato
 */
class ProviderFactory {
  constructor() {
    this.adapters = new Map();
    this.defaultProvider = 'sportmonks';
    
    // Inizializza adapter disponibili
    this._initializeAdapters();
  }

  /**
   * Inizializza tutti gli adapter disponibili
   */
  _initializeAdapters() {
    // Sportmonks adapter (primario)
    this.adapters.set('sportmonks', new SportmonksAdapter());
    
    // API-Football adapter (legacy) - TODO: implementare se necessario
    // this.adapters.set('api-football', new ApiFootballAdapter());
    
    console.log(`[ProviderFactory] Initialized ${this.adapters.size} providers: ${Array.from(this.adapters.keys()).join(', ')}`);
  }

  /**
   * Ottiene un adapter specifico
   * @param {string} providerName - Nome del provider ('sportmonks', 'api-football')
   * @returns {object} Adapter instance
   */
  getAdapter(providerName = null) {
    const provider = providerName || this.defaultProvider;
    
    if (!this.adapters.has(provider)) {
      throw new Error(`Provider '${provider}' not available. Available: ${Array.from(this.adapters.keys()).join(', ')}`);
    }

    return this.adapters.get(provider);
  }

  /**
   * Mappa fixtures usando il provider specificato
   * @param {array} fixtures - Array di fixtures raw
   * @param {string} providerName - Nome del provider
   * @returns {object} Risultato mapping con successful/failed
   */
  mapFixtures(fixtures, providerName = null) {
    const adapter = this.getAdapter(providerName);
    return adapter.mapMultipleFixtures(fixtures);
  }

  /**
   * Mappa singola fixture
   * @param {object} fixture - Fixture raw
   * @param {string} providerName - Nome del provider  
   * @returns {object} StandardFixture DTO
   */
  mapFixture(fixture, providerName = null) {
    const adapter = this.getAdapter(providerName);
    return adapter.mapToStandardFixture(fixture);
  }

  /**
   * Lista dei provider disponibili
   * @returns {array} Array dei nomi provider
   */
  getAvailableProviders() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Imposta il provider di default
   * @param {string} providerName - Nome del provider
   */
  setDefaultProvider(providerName) {
    if (!this.adapters.has(providerName)) {
      throw new Error(`Cannot set default to unavailable provider '${providerName}'`);
    }
    
    this.defaultProvider = providerName;
    console.log(`[ProviderFactory] Default provider set to: ${providerName}`);
  }

  /**
   * Health check per tutti i provider
   * @returns {object} Status di ogni provider
   */
  healthCheck() {
    const status = {};
    
    for (const [name, adapter] of this.adapters) {
      try {
        // Test base: verifica che l'adapter abbia i metodi richiesti
        const requiredMethods = ['mapToStandardFixture', 'mapMultipleFixtures'];
        const hasAllMethods = requiredMethods.every(method => typeof adapter[method] === 'function');
        
        status[name] = {
          available: true,
          hasRequiredMethods: hasAllMethods,
          provider: adapter.provider || 'unknown'
        };
      } catch (error) {
        status[name] = {
          available: false,
          error: error.message
        };
      }
    }
    
    return {
      defaultProvider: this.defaultProvider,
      providers: status,
      totalProviders: this.adapters.size
    };
  }
}

// Singleton instance
const providerFactory = new ProviderFactory();

module.exports = providerFactory;
