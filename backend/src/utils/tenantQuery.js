/**
 * Utility per gestire query tenant-aware in modo consistente
 */
const mongoose = require('mongoose');

class TenantQuery {
  
  /**
   * Converte tenantId in ObjectId se necessario
   * @param {String|ObjectId} tenantId - ID del tenant
   * @returns {ObjectId} ObjectId valido
   */
  static normalizeTenantId(tenantId) {
    if (!tenantId) {
      throw new Error('Tenant ID is required for tenant-aware queries');
    }
    
    // Se è già un ObjectId, restituiscilo
    if (mongoose.Types.ObjectId.isValid(tenantId) && typeof tenantId === 'object') {
      return tenantId;
    }
    
    // Se è una stringa valida, convertila in ObjectId
    if (typeof tenantId === 'string' && mongoose.Types.ObjectId.isValid(tenantId)) {
      return new mongoose.Types.ObjectId(tenantId);
    }
    
    throw new Error(`Invalid tenant ID: ${tenantId}`);
  }
  
  /**
   * Aggiunge il filtro tenant a una query
   * @param {Object} query - Query MongoDB esistente
   * @param {String} tenantId - ID del tenant
   * @returns {Object} Query con filtro tenant
   */
  static addTenantFilter(query = {}, tenantId) {
    const normalizedTenantId = this.normalizeTenantId(tenantId);
    
    return {
      ...query,
      tenantId: normalizedTenantId
    };
  }
  
  /**
   * Crea una query tenant-aware per un modello
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query aggiuntiva (opzionale)
   * @returns {Object} Query builder Mongoose
   */
  static find(Model, tenantId, query = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.find(tenantQuery);
  }
  
  /**
   * Trova un singolo documento tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query aggiuntiva (opzionale)
   * @returns {Object} Query builder Mongoose
   */
  static findOne(Model, tenantId, query = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.findOne(tenantQuery);
  }
  
  /**
   * Trova per ID con controllo tenant
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {String} documentId - ID del documento
   * @returns {Object} Query builder Mongoose
   */
  static async findById(Model, tenantId, documentId) {
    console.log('🔍 TENANTQUERY DEBUG: findById called');
    console.log('   - Model:', Model.modelName);
    console.log('   - Database:', mongoose.connection.name);
    console.log('   - Connection state:', mongoose.connection.readyState);
    console.log('   - tenantId input:', tenantId, '(type:', typeof tenantId, ')');
    console.log('   - documentId:', documentId, '(type:', typeof documentId, ')');
    
    const normalizedTenantId = this.normalizeTenantId(tenantId);
    console.log('   - normalizedTenantId:', normalizedTenantId, '(type:', typeof normalizedTenantId, ')');
    
    // Convert documentId to ObjectId if it's a valid string
    const normalizedDocumentId = mongoose.Types.ObjectId.isValid(documentId) 
      ? new mongoose.Types.ObjectId(documentId) 
      : documentId;
    console.log('   - normalizedDocumentId:', normalizedDocumentId, '(type:', typeof normalizedDocumentId, ')');
    
    const query = {
      _id: normalizedDocumentId,
      tenantId: normalizedTenantId
    };
    console.log('   - query with ObjectIds:', query);
    
    // Test if collection exists and has documents
    const collectionExists = await mongoose.connection.db.listCollections({name: 'venues'}).hasNext();
    console.log('   - venues collection exists:', collectionExists);
    
    if (collectionExists) {
      const venueCount = await Model.countDocuments({});
      console.log('   - total venues in collection:', venueCount);
    }
    
    const result = await Model.findOne(query);
    console.log('   - RESULT:', result ? `FOUND: ${result.name}` : 'NOT FOUND');
    
    return result;
  }
  
  /**
   * Conta documenti tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query aggiuntiva (opzionale)
   * @returns {Object} Query builder Mongoose
   */
  static count(Model, tenantId, query = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.countDocuments(tenantQuery);
  }
  
  /**
   * Crea un nuovo documento con tenantId
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} data - Dati del documento
   * @returns {Object} Nuovo documento
   */
  static create(Model, tenantId, data) {
    const documentData = {
      ...data,
      tenantId: tenantId
    };
    return new Model(documentData);
  }
  
  /**
   * Aggiorna documenti tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query per trovare documenti
   * @param {Object} update - Aggiornamenti da applicare
   * @param {Object} options - Opzioni Mongoose (opzionale)
   * @returns {Promise} Risultato dell'aggiornamento
   */
  static updateMany(Model, tenantId, query = {}, update, options = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.updateMany(tenantQuery, update, options);
  }
  
  /**
   * Aggiorna un singolo documento tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query per trovare il documento
   * @param {Object} update - Aggiornamenti da applicare
   * @param {Object} options - Opzioni Mongoose (opzionale)
   * @returns {Promise} Risultato dell'aggiornamento
   */
  static updateOne(Model, tenantId, query = {}, update, options = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.updateOne(tenantQuery, update, options);
  }
  
  /**
   * Trova e aggiorna un documento tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query per trovare il documento
   * @param {Object} update - Aggiornamenti da applicare
   * @param {Object} options - Opzioni Mongoose (opzionale)
   * @returns {Promise} Documento aggiornato
   */
  static findOneAndUpdate(Model, tenantId, query = {}, update, options = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.findOneAndUpdate(tenantQuery, update, options);
  }
  
  /**
   * Elimina documenti tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query per trovare documenti
   * @returns {Promise} Risultato dell'eliminazione
   */
  static deleteMany(Model, tenantId, query = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.deleteMany(tenantQuery);
  }
  
  /**
   * Elimina un singolo documento tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query per trovare il documento
   * @returns {Promise} Risultato dell'eliminazione
   */
  static deleteOne(Model, tenantId, query = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.deleteOne(tenantQuery);
  }
  
  /**
   * Trova e elimina un documento tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Object} query - Query per trovare il documento
   * @returns {Promise} Documento eliminato
   */
  static findOneAndDelete(Model, tenantId, query = {}) {
    const tenantQuery = this.addTenantFilter(query, tenantId);
    return Model.findOneAndDelete(tenantQuery);
  }
  
  /**
   * Aggregation pipeline tenant-aware
   * @param {Object} Model - Modello Mongoose
   * @param {String} tenantId - ID del tenant
   * @param {Array} pipeline - Pipeline di aggregazione
   * @returns {Object} Aggregation builder
   */
  static aggregate(Model, tenantId, pipeline = []) {
    const normalizedTenantId = this.normalizeTenantId(tenantId);
    
    // Aggiungi il match per tenant all'inizio della pipeline
    const tenantPipeline = [
      { $match: { tenantId: normalizedTenantId } },
      ...pipeline
    ];
    return Model.aggregate(tenantPipeline);
  }
  
  /**
   * Middleware per validare che un documento appartenga al tenant corrente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   * @param {Object} document - Documento da validare
   * @returns {Boolean} True se valido, altrimenti invia errore 403
   */
  static validateTenantOwnership(req, res, next, document) {
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required'
      });
    }
    
    // Converti entrambi in string per confronto sicuro
    const docTenantId = document.tenantId ? document.tenantId.toString() : null;
    const reqTenantId = req.tenantId.toString();
    
    if (docTenantId !== reqTenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Resource belongs to different tenant'
      });
    }
    
    return true;
  }
  
  /**
   * Crea un middleware per validare l'ownership di un documento
   * @param {Object} Model - Modello Mongoose
   * @param {String} paramName - Nome del parametro nell'URL (default: 'id')
   * @returns {Function} Middleware function
   */
  static createOwnershipValidator(Model, paramName = 'id') {
    return async (req, res, next) => {
      try {
        const documentId = req.params[paramName];
        const document = await TenantQuery.findById(Model, req.tenantId, documentId);
        
        if (TenantQuery.validateTenantOwnership(req, res, next, document)) {
          req.document = document; // Aggiungi il documento al request per uso successivo
          next();
        }
      } catch (error) {
        console.error('Tenant ownership validation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Error validating resource ownership'
        });
      }
    };
  }
}

module.exports = TenantQuery; 