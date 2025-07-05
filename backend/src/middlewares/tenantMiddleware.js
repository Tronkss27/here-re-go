const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Middleware per estrarre e validare il tenant context dalle richieste
 */
class TenantMiddleware {
  
  /**
   * Estrae il tenant ID da diverse fonti (headers, subdomain, JWT)
   */
  static async extractTenant(req, res, next) {
    try {
      let tenantId = null;
      let tenant = null;
      
      console.log('🔍 DEBUG: Starting tenant extraction...');
      console.log('- Headers:', req.headers['x-tenant-id']);
      console.log('- Host:', req.get('host'));
      
      // Metodo 1: Header X-Tenant-ID (priorità alta per API calls)
      if (req.headers['x-tenant-id']) {
        tenantId = req.headers['x-tenant-id'];
        console.log('🔍 DEBUG: Found tenant ID in header:', tenantId);
      }
      
      // Metodo 2: Subdomain extraction (per web app)
      else if (req.get('host')) {
        const host = req.get('host');
        const subdomain = TenantMiddleware.extractSubdomain(host);
        
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
          // Cerca tenant per subdomain
          tenant = await Tenant.findOne({ 
            subdomain: subdomain,
            status: { $in: ['active', 'trial'] }
          });
          
          if (tenant) {
            tenantId = tenant._id.toString();
          }
        }
      }
      
      // Metodo 3: JWT token (se presente)
      if (!tenantId && req.headers.authorization) {
        try {
          const token = req.headers.authorization.replace('Bearer ', '');
          const decoded = jwt.decode(token, { complete: true });
          
          if (decoded && decoded.payload && decoded.payload.tenantId) {
            tenantId = decoded.payload.tenantId;
          }
        } catch (error) {
          // JWT decode failed, continua con gli altri metodi
        }
      }
      
      // Se non abbiamo trovato il tenant, cerchiamo di caricarlo dal DB
      if (tenantId && !tenant) {
        console.log('🔍 DEBUG: Loading tenant from DB, tenantId:', tenantId);
        
        // Prima prova per slug, poi per ObjectId
        if (mongoose.Types.ObjectId.isValid(tenantId)) {
          tenant = await Tenant.findById(tenantId);
          console.log('🔍 DEBUG: Searched by ObjectId, found:', tenant ? tenant.slug : 'null');
        } else {
          // Cerca per slug
          tenant = await Tenant.findOne({ slug: tenantId });
          console.log('🔍 DEBUG: Searched by slug, found:', tenant ? tenant._id : 'null');
        }
      }
      
      // Se ancora non abbiamo un tenant e siamo su localhost, usiamo il default
      if (!tenant && (req.get('host') || '').includes('localhost')) {
        console.log('🔍 DEBUG: No tenant found, creating default tenant');
        tenant = await TenantMiddleware.getOrCreateDefaultTenant();
        tenantId = tenant._id.toString();
        console.log('🔍 DEBUG: Default tenant created/loaded:', tenant.slug, tenant._id);
      }
      
      // Aggiungi context al request
      req.tenant = tenant;
      req.tenantId = tenant ? tenant._id : null;
      
      // Headers per debug
      if (process.env.NODE_ENV === 'development') {
        res.set('X-Tenant-Debug', tenant ? tenant.slug : 'none');
      }
      
      next();
      
    } catch (error) {
      console.error('Tenant extraction error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error during tenant resolution'
      });
    }
  }
  
  /**
   * Middleware che richiede un tenant valido
   */
  static requireTenant(req, res, next) {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required',
        message: 'Please specify a valid tenant via header, subdomain, or authentication'
      });
    }
    
    // Verifica stato tenant
    if (!req.tenant.isActive && req.tenant.status !== 'trial') {
      return res.status(403).json({
        success: false,
        error: 'Tenant access denied',
        message: `Tenant status: ${req.tenant.status}`
      });
    }
    
    // Verifica trial scaduto
    if (req.tenant.isTrialExpired) {
      return res.status(402).json({
        success: false,
        error: 'Trial expired',
        message: 'Please upgrade your subscription to continue'
      });
    }
    
    next();
  }
  
  /**
   * Middleware per validare i permessi del tenant per un'operazione
   */
  static checkTenantPermission(featureKey) {
    return (req, res, next) => {
      if (!req.tenant) {
        return res.status(400).json({
          success: false,
          error: 'Tenant context required'
        });
      }
      
      // Controlla se la feature è abilitata
      const featureEnabled = req.tenant.settings?.features?.[featureKey];
      
      if (!featureEnabled) {
        return res.status(403).json({
          success: false,
          error: 'Feature not available',
          message: `The feature '${featureKey}' is not enabled for your plan`
        });
      }
      
      next();
    };
  }
  
  /**
   * Middleware per controllare i limiti del tenant
   */
  static checkTenantLimit(limitKey, increment = 1) {
    return async (req, res, next) => {
      if (!req.tenant) {
        return res.status(400).json({
          success: false,
          error: 'Tenant context required'
        });
      }
      
      try {
        const currentValue = req.tenant.usage[`current${limitKey.charAt(0).toUpperCase() + limitKey.slice(1)}`];
        const limit = req.tenant.settings.limits[limitKey];
        
        if (limit && (currentValue + increment) > limit) {
          return res.status(429).json({
            success: false,
            error: 'Limit exceeded',
            message: `Maximum ${limitKey} limit (${limit}) would be exceeded`,
            current: currentValue,
            limit: limit
          });
        }
        
        next();
        
      } catch (error) {
        console.error('Tenant limit check error:', error);
        return res.status(500).json({
          success: false,
          error: 'Error checking tenant limits'
        });
      }
    };
  }
  
  /**
   * Utility per estrarre subdomain da host
   */
  static extractSubdomain(host) {
    if (!host) return null;
    
    // Rimuovi porta se presente
    const cleanHost = host.split(':')[0];
    
    // Split per domini
    const parts = cleanHost.split('.');
    
    // Per localhost o IP, non c'è subdomain
    if (parts.length < 3 || cleanHost.includes('localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
      return null;
    }
    
    // Primo part è il subdomain
    return parts[0];
  }
  
  /**
   * Crea o ottiene il tenant di default per sviluppo
   */
  static async getOrCreateDefaultTenant() {
    try {
      let defaultTenant = await Tenant.findOne({ slug: 'default' });
      
      if (!defaultTenant) {
        // Crea un user ID temporaneo
        const tempUserId = new mongoose.Types.ObjectId();
        
        defaultTenant = new Tenant({
          slug: 'default',
          name: 'Default Tenant',
          subdomain: 'default',
          status: 'active',
          plan: 'trial',
          ownerUser: tempUserId,
          settings: {
            features: {
              bookingSystem: true,
              multiVenue: true,
              eventManagement: true,
              analytics: true,
              customDomain: false
            },
            limits: {
              maxVenues: 5,
              maxUsers: 20,
              maxBookingsPerMonth: 1000,
              storageLimit: 500
            }
          }
        });
        
        await defaultTenant.save();
        console.log('✅ Created default tenant for development');
      }
      
      return defaultTenant;
      
    } catch (error) {
      console.error('Error creating default tenant:', error);
      throw error;
    }
  }
  
  /**
   * Middleware per logging delle operazioni tenant
   */
  static logTenantOperation(operation) {
    return (req, res, next) => {
      if (req.tenant && process.env.NODE_ENV === 'development') {
        console.log(`[TENANT] ${req.tenant.slug}: ${operation} - ${req.method} ${req.originalUrl}`);
      }
      next();
    };
  }
  
  /**
   * Middleware per aggiornare l'ultimo accesso del tenant
   */
  static updateLastActivity(req, res, next) {
    if (req.tenant) {
      // Update async senza aspettare
      req.tenant.usage.lastActivity = new Date();
      req.tenant.save().catch(error => {
        console.warn('Failed to update tenant last activity:', error);
      });
    }
    next();
  }

  /**
   * Middleware per controllare i permessi dell'utente nel tenant
   */
  static tenantPermissions(requiredRole = 'user') {
    return (req, res, next) => {
      // Verifica autenticazione
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Verifica tenant context
      if (!req.tenant) {
        return res.status(400).json({
          success: false,
          error: 'Tenant context required'
        });
      }

      // Verifica che l'user appartenga al tenant
      if (req.user.tenantId.toString() !== req.tenant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: User does not belong to this tenant'
        });
      }

      // Verifica ruolo
      const userRole = req.user.role;
      const roleHierarchy = {
        'user': 0,
        'staff': 1,
        'admin': 2,
        'system_admin': 3
      };

      const userLevel = roleHierarchy[userRole] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: `Access denied: ${requiredRole} role required, current role: ${userRole}`
        });
      }

      next();
    };
  }
}

module.exports = TenantMiddleware; 