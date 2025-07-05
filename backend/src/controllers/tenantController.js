const Tenant = require('../models/Tenant')
const User = require('../models/User')
const TenantQuery = require('../utils/tenantQuery')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

class TenantController {

  /**
   * @desc    Registra un nuovo tenant
   * @route   POST /api/tenants/register
   * @access  Public
   */
  async register(req, res) {
    try {
      const {
        tenantInfo,
        ownerInfo,
        businessInfo,
        plan = 'trial'
      } = req.body

      // Validazione dati richiesti
      if (!tenantInfo?.name || !tenantInfo?.slug) {
        return res.status(400).json({
          success: false,
          error: 'Tenant name and slug are required'
        })
      }

      if (!ownerInfo?.name || !ownerInfo?.email || !ownerInfo?.password) {
        return res.status(400).json({
          success: false,
          error: 'Owner name, email and password are required'
        })
      }

      // Verifica slug univoco
      const existingTenant = await Tenant.findOne({ slug: tenantInfo.slug })
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          error: 'Tenant slug already exists'
        })
      }

      // Verifica email univoca (globalmente)
      const existingUser = await User.findOne({ email: ownerInfo.email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        })
      }

      // Crea tenant temporaneo per ottenere ID
      const tempTenant = new Tenant({
        slug: tenantInfo.slug,
        name: tenantInfo.name,
        subdomain: tenantInfo.subdomain || tenantInfo.slug,
        domain: tenantInfo.domain,
        plan,
        ownerUser: new mongoose.Types.ObjectId(), // Temporaneo
        businessInfo: businessInfo || {},
        status: 'trial'
      })

      // Crea owner user con tenantId
      const ownerUser = new User({
        name: ownerInfo.name,
        email: ownerInfo.email,
        password: ownerInfo.password,
        role: 'admin',
        tenantId: tempTenant._id
      })

      // Salva user e aggiorna tenant con owner corretto
      await ownerUser.save()
      tempTenant.ownerUser = ownerUser._id
      await tempTenant.save()

      // Genera JWT token per il nuovo tenant/user
      const token = jwt.sign(
        { 
          userId: ownerUser._id,
          tenantId: tempTenant._id,
          role: ownerUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.status(201).json({
        success: true,
        data: {
          tenant: {
            id: tempTenant._id,
            slug: tempTenant.slug,
            name: tempTenant.name,
            subdomain: tempTenant.subdomain,
            plan: tempTenant.plan,
            status: tempTenant.status,
            remainingTrialDays: tempTenant.remainingTrialDays
          },
          user: {
            id: ownerUser._id,
            name: ownerUser.name,
            email: ownerUser.email,
            role: ownerUser.role
          },
          token
        },
        message: 'Tenant registered successfully'
      })

    } catch (error) {
      console.error('Tenant registration error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Ottieni informazioni tenant corrente
   * @route   GET /api/tenants/current
   * @access  Private
   */
  async getCurrentTenant(req, res) {
    try {
      if (!req.tenant) {
        return res.status(400).json({
          success: false,
          error: 'Tenant context required'
        })
      }

      // Popola owner user info
      await req.tenant.populate('ownerUser', 'name email role')

      res.json({
        success: true,
        data: {
          id: req.tenant._id,
          slug: req.tenant.slug,
          name: req.tenant.name,
          subdomain: req.tenant.subdomain,
          domain: req.tenant.domain,
          plan: req.tenant.plan,
          status: req.tenant.status,
          settings: req.tenant.settings,
          businessInfo: req.tenant.businessInfo,
          usage: req.tenant.usage,
          isActive: req.tenant.isActive,
          isTrialExpired: req.tenant.isTrialExpired,
          remainingTrialDays: req.tenant.remainingTrialDays,
          trialEndsAt: req.tenant.trialEndsAt,
          ownerUser: req.tenant.ownerUser,
          createdAt: req.tenant.createdAt,
          updatedAt: req.tenant.updatedAt
        }
      })

    } catch (error) {
      console.error('Get current tenant error:', error)
      res.status(500).json({
        success: false,
        error: 'Error fetching tenant information'
      })
    }
  }

  /**
   * @desc    Aggiorna configurazione tenant
   * @route   PUT /api/tenants/current
   * @access  Private (admin del tenant)
   */
  async updateTenant(req, res) {
    try {
      const updates = req.body
      
      // Campi non modificabili
      delete updates._id
      delete updates.__v
      delete updates.ownerUser
      delete updates.createdAt
      delete updates.usage
      delete updates.plan // Il piano si cambia con endpoint dedicato

      // Validazioni speciali
      if (updates.slug && updates.slug !== req.tenant.slug) {
        const existingTenant = await Tenant.findOne({ 
          slug: updates.slug,
          _id: { $ne: req.tenant._id }
        })
        if (existingTenant) {
          return res.status(400).json({
            success: false,
            error: 'Slug already exists'
          })
        }
      }

      // Aggiorna tenant
      const updatedTenant = await Tenant.findByIdAndUpdate(
        req.tenant._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('ownerUser', 'name email role')

      res.json({
        success: true,
        data: updatedTenant,
        message: 'Tenant updated successfully'
      })

    } catch (error) {
      console.error('Update tenant error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Ottieni statistiche usage tenant
   * @route   GET /api/tenants/current/usage
   * @access  Private
   */
  async getTenantUsage(req, res) {
    try {
      if (!req.tenant) {
        return res.status(400).json({
          success: false,
          error: 'Tenant context required'
        })
      }

      // Calcola usage real-time
      const [userCount, venueCount, bookingCount] = await Promise.all([
        TenantQuery.count(User, req.tenantId, { isActive: true }),
        TenantQuery.count(require('../models/Venue'), req.tenantId, { isActive: true }),
        TenantQuery.count(require('../models/Booking'), req.tenantId, {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        })
      ])

      // Aggiorna usage nel tenant
      req.tenant.usage.currentUsers = userCount
      req.tenant.usage.currentVenues = venueCount
      req.tenant.usage.bookingsThisMonth = bookingCount
      await req.tenant.save()

      // Calcola limiti e percentuali
      const limits = req.tenant.settings.limits
      const usagePercentages = {
        users: limits.maxUsers ? Math.round((userCount / limits.maxUsers) * 100) : 0,
        venues: limits.maxVenues ? Math.round((venueCount / limits.maxVenues) * 100) : 0,
        bookings: limits.maxBookingsPerMonth ? Math.round((bookingCount / limits.maxBookingsPerMonth) * 100) : 0
      }

      res.json({
        success: true,
        data: {
          current: {
            users: userCount,
            venues: venueCount,
            bookingsThisMonth: bookingCount,
            storageUsed: req.tenant.usage.storageUsed
          },
          limits: limits,
          percentages: usagePercentages,
          alerts: {
            usersNearLimit: usagePercentages.users > 80,
            venuesNearLimit: usagePercentages.venues > 80,
            bookingsNearLimit: usagePercentages.bookings > 80
          }
        }
      })

    } catch (error) {
      console.error('Get tenant usage error:', error)
      res.status(500).json({
        success: false,
        error: 'Error fetching usage statistics'
      })
    }
  }

  /**
   * @desc    Lista tutti i tenant (solo admin sistema)
   * @route   GET /api/tenants
   * @access  Private (system admin)
   */
  async getAllTenants(req, res) {
    try {
      // Verifica permessi system admin
      if (!req.user || req.user.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'System admin access required'
        })
      }

      const {
        page = 1,
        limit = 20,
        status,
        plan,
        search
      } = req.query

      // Build filter
      const filter = {}
      if (status) filter.status = status
      if (plan) filter.plan = plan
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ]
      }

      const skip = (page - 1) * limit
      const tenants = await Tenant.find(filter)
        .populate('ownerUser', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))

      const total = await Tenant.countDocuments(filter)

      res.json({
        success: true,
        data: tenants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      })

    } catch (error) {
      console.error('Get all tenants error:', error)
      res.status(500).json({
        success: false,
        error: 'Error fetching tenants'
      })
    }
  }

  /**
   * @desc    Aggiorna piano tenant
   * @route   PUT /api/tenants/current/plan
   * @access  Private (admin del tenant)
   */
  async updatePlan(req, res) {
    try {
      const { plan } = req.body

      const validPlans = ['trial', 'basic', 'premium', 'enterprise']
      if (!validPlans.includes(plan)) {
        return res.status(400).json({
          success: false,
          error: `Invalid plan. Must be one of: ${validPlans.join(', ')}`
        })
      }

      // Aggiorna piano e limiti
      req.tenant.plan = plan
      
      // Aggiorna limiti in base al piano
      switch (plan) {
        case 'trial':
          req.tenant.settings.limits = {
            maxVenues: 1,
            maxUsers: 5,
            maxBookingsPerMonth: 100,
            storageLimit: 50
          }
          req.tenant.settings.features.multiVenue = false
          req.tenant.settings.features.customDomain = false
          break
        case 'basic':
          req.tenant.settings.limits = {
            maxVenues: 1,
            maxUsers: 10,
            maxBookingsPerMonth: 500,
            storageLimit: 200
          }
          req.tenant.settings.features.multiVenue = false
          req.tenant.settings.features.customDomain = false
          break
        case 'premium':
          req.tenant.settings.limits = {
            maxVenues: 3,
            maxUsers: 25,
            maxBookingsPerMonth: 2000,
            storageLimit: 1000
          }
          req.tenant.settings.features.multiVenue = true
          req.tenant.settings.features.customDomain = true
          break
        case 'enterprise':
          req.tenant.settings.limits = {
            maxVenues: 10,
            maxUsers: 100,
            maxBookingsPerMonth: 10000,
            storageLimit: 5000
          }
          req.tenant.settings.features.multiVenue = true
          req.tenant.settings.features.customDomain = true
          break
      }

      if (plan !== 'trial') {
        req.tenant.status = 'active'
      }

      await req.tenant.save()

      res.json({
        success: true,
        data: req.tenant,
        message: `Plan updated to ${plan} successfully`
      })

    } catch (error) {
      console.error('Update plan error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = new TenantController() 