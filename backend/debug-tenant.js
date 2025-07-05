#!/usr/bin/env node

/**
 * Script di debug per testare le funzionalità base del sistema multi-tenant
 */

const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

const log = (msg) => console.log(`[DEBUG] ${msg}`)

async function debugTenant() {
  try {
    // 1. Health check
    log('Testing health check...')
    const health = await axios.get(`${BASE_URL}/api/health`)
    log(`Health: ${health.status} - ${health.data.status}`)
    
    // 2. Test route
    log('Testing tenant test route...')
    const test = await axios.get(`${BASE_URL}/api/tenants/test`)
    log(`Test route: ${test.status} - ${test.data.message}`)
    
    // 3. Tentativo registrazione tenant
    log('Testing tenant registration...')
    const tenantData = {
      tenantInfo: {
        name: 'Debug Tenant',
        slug: 'debug-tenant',
        subdomain: 'debug-tenant'
      },
      ownerInfo: {
        name: 'Debug Admin',
        email: 'debug@test.com',
        password: 'TestPass123!'
      },
      businessInfo: {
        type: 'sports_bar',
        address: {
          street: 'Via Debug 123',
          city: 'Roma',
          country: 'IT'
        },
        contact: {
          email: 'info@debug.com',
          phone: '+39 06 1234567'
        }
      }
    }
    
    const registerResponse = await axios.post(`${BASE_URL}/api/tenants/register`, tenantData)
    log(`Registration: ${registerResponse.status}`)
    log(`Response: ${JSON.stringify(registerResponse.data, null, 2)}`)
    
    // 4. Test con tenant-id
    if (registerResponse.data.data?.tenant?.slug) {
      const tenantSlug = registerResponse.data.data.tenant.slug
      log(`Testing with tenant slug: ${tenantSlug}`)
      
      const currentResponse = await axios.get(`${BASE_URL}/api/tenants/current`, {
        headers: {
          'X-Tenant-ID': tenantSlug
        }
      })
      
      log(`Current tenant: ${currentResponse.status}`)
      log(`Response: ${JSON.stringify(currentResponse.data, null, 2)}`)
    }
    
  } catch (error) {
    console.error('[ERROR]', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
  }
}

// Aspetta 2 secondi e poi esegue il debug
setTimeout(debugTenant, 2000) 