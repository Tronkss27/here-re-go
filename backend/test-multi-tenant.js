#!/usr/bin/env node

/**
 * Suite di Test Multi-Tenant per SPOrTS
 * Verifica l'isolamento completo tra tenant e tutte le funzionalità
 */

const axios = require('axios')

// Colori semplici senza chalk
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const chalk = {
  red: (text) => `${colors.red}${text}${colors.reset}`,
  green: (text) => `${colors.green}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  magenta: (text) => `${colors.magenta}${text}${colors.reset}`,
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  bold: {
    yellow: (text) => `${colors.bright}${colors.yellow}${text}${colors.reset}`,
    cyan: (text) => `${colors.bright}${colors.cyan}${text}${colors.reset}`,
    magenta: (text) => `${colors.bright}${colors.magenta}${text}${colors.reset}`,
    green: (text) => `${colors.bright}${colors.green}${text}${colors.reset}`,
    red: (text) => `${colors.bright}${colors.red}${text}${colors.reset}`
  }
}

const BASE_URL = 'http://localhost:3001'
const TIMEOUT = 10000

// Configurazione test
const testConfig = {
  tenantA: {
    name: 'Tenant A Sports Bar',
    slug: 'tenant-a',
    email: 'admin@tenant-a.com',
    password: 'TestPass123!'
  },
  tenantB: {
    name: 'Tenant B Pub',
    slug: 'tenant-b', 
    email: 'admin@tenant-b.com',
    password: 'TestPass123!'
  }
}

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
}

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠️'), msg),
  title: (msg) => console.log('\n' + chalk.bold.cyan('🧪', msg))
}

const assert = (condition, message, debugInfo = null) => {
  testResults.total++
  if (condition) {
    testResults.passed++
    log.success(message)
  } else {
    testResults.failed++
    const errorMsg = debugInfo ? `${message} - Debug: ${JSON.stringify(debugInfo)}` : message
    testResults.errors.push(errorMsg)
    log.error(errorMsg)
  }
}

const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
    
    if (data) {
      config.data = data
    }
    
    const response = await axios(config)
    return { success: true, data: response.data, status: response.status, headers: response.headers }
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    }
  }
}

// Test Functions
class MultiTenantTests {
  
  static async healthCheck() {
    log.title('1. Health Check e Connettività')
    
    const response = await makeRequest('GET', '/api/health')
    assert(response.success, 'Server is running and accessible')
    assert(response.status === 200, 'Health endpoint returns 200')
    
    // Verifica headers di sicurezza
    const headers = response.headers
    assert(headers['content-security-policy'], 'CSP header is present')
    assert(headers['x-frame-options'], 'X-Frame-Options header is present')
    assert(headers['x-content-type-options'], 'X-Content-Type-Options header is present')
    
    log.info('Health check completed')
  }
  
  static async testTenantRegistration() {
    log.title('2. Registrazione Tenant')
    
    // Registra Tenant A
    const tenantAData = {
      tenantInfo: {
        name: testConfig.tenantA.name,
        slug: testConfig.tenantA.slug,
        subdomain: testConfig.tenantA.slug
      },
      ownerInfo: {
        name: 'Admin Tenant A',
        email: testConfig.tenantA.email,
        password: testConfig.tenantA.password
      },
      businessInfo: {
        type: 'sports_bar',
        address: {
          street: 'Via Roma 123',
          city: 'Milano',
          country: 'IT'
        },
        contact: {
          email: 'info@tenant-a.com',
          phone: '+39 02 1234567'
        }
      }
    }
    
    const responseA = await makeRequest('POST', '/api/tenants/register', tenantAData)
    assert(responseA.success, 'Tenant A registration successful')
    assert(responseA.data?.data?.tenant?.slug === testConfig.tenantA.slug, 'Tenant A slug correct')
    assert(responseA.data?.data?.token, 'Tenant A JWT token generated')
    
    // Salva dati Tenant A
    if (responseA.success) {
      testConfig.tenantA.id = responseA.data.data.tenant.id
      testConfig.tenantA.token = responseA.data.data.token
      testConfig.tenantA.userId = responseA.data.data.user.id
    }
    
    // Registra Tenant B
    const tenantBData = {
      tenantInfo: {
        name: testConfig.tenantB.name,
        slug: testConfig.tenantB.slug,
        subdomain: testConfig.tenantB.slug
      },
      ownerInfo: {
        name: 'Admin Tenant B',
        email: testConfig.tenantB.email,
        password: testConfig.tenantB.password
      },
      businessInfo: {
        type: 'pub',
        address: {
          street: 'Via Torino 456',
          city: 'Roma',
          country: 'IT'
        },
        contact: {
          email: 'info@tenant-b.com',
          phone: '+39 06 7654321'
        }
      }
    }
    
    const responseB = await makeRequest('POST', '/api/tenants/register', tenantBData)
    assert(responseB.success, 'Tenant B registration successful')
    assert(responseB.data?.data?.tenant?.slug === testConfig.tenantB.slug, 'Tenant B slug correct')
    assert(responseB.data?.data?.token, 'Tenant B JWT token generated')
    
    // Salva dati Tenant B
    if (responseB.success) {
      testConfig.tenantB.id = responseB.data.data.tenant.id
      testConfig.tenantB.token = responseB.data.data.token
      testConfig.tenantB.userId = responseB.data.data.user.id
    }
    
    // Test duplicazione slug
    const duplicateResponse = await makeRequest('POST', '/api/tenants/register', tenantAData)
    assert(!duplicateResponse.success, 'Duplicate slug registration properly rejected')
    
    log.info('Tenant registration tests completed')
  }
  
  static async testTenantContext() {
    log.title('3. Context e Identificazione Tenant')
    
    // Test con header X-Tenant-ID
    const headerResponse = await makeRequest('GET', '/api/tenants/current', null, {
      'X-Tenant-ID': testConfig.tenantA.slug
    })
    assert(headerResponse.success, 'Tenant identified via X-Tenant-ID header', headerResponse.error)
    assert(headerResponse.data?.data?.slug === testConfig.tenantA.slug, 'Correct tenant returned via header', headerResponse.data)
    
    // Test con header X-Tenant-Debug (per default tenant)
    const debugResponse = await makeRequest('GET', '/api/tenants/current', null, {
      'X-Tenant-Debug': 'default'
    })
    assert(debugResponse.success, 'Default tenant accessible via debug header', debugResponse.error)
    assert(debugResponse.data?.data?.slug === 'default', 'Default tenant returned correctly', debugResponse.data)
    
    // Test senza header (dovrebbe fallire o usare default)
    const noHeaderResponse = await makeRequest('GET', '/api/tenants/current')
    if (noHeaderResponse.success) {
      assert(noHeaderResponse.data?.data?.slug === 'default', 'Falls back to default tenant when no context', noHeaderResponse.data)
    } else {
      log.info('No header test failed as expected - needs tenant context')
    }
    
    log.info('Tenant context tests completed')
  }
  
  static async testDataIsolation() {
    log.title('4. Isolamento Dati tra Tenant')
    
    // Crea prenotazione per Tenant A
    const bookingA = {
      venue: 'venue_1',
      date: '2025-07-15',
      timeSlot: { start: '19:00', end: '21:00' },
      partySize: 4,
      customer: {
        name: 'Cliente Tenant A',
        email: 'cliente@tenant-a.com',
        phone: '+39 333 1111111'
      }
    }
    
    const createBookingA = await makeRequest('POST', '/api/bookings', bookingA, {
      'X-Tenant-ID': testConfig.tenantA.slug,
      'Authorization': `Bearer ${testConfig.tenantA.token}`
    })
    assert(createBookingA.success, 'Booking created for Tenant A', createBookingA.error)
    
    let bookingAId = null
    if (createBookingA.success) {
      bookingAId = createBookingA.data.data._id || createBookingA.data.data.id
      assert(createBookingA.data.data.tenantId === testConfig.tenantA.id, 'Booking A has correct tenantId', {
        expected: testConfig.tenantA.id,
        actual: createBookingA.data.data.tenantId
      })
    }
    
    // Crea prenotazione per Tenant B
    const bookingB = {
      venue: 'venue_1',
      date: '2025-07-15', 
      timeSlot: { start: '19:00', end: '21:00' },
      partySize: 2,
      customer: {
        name: 'Cliente Tenant B',
        email: 'cliente@tenant-b.com',
        phone: '+39 333 2222222'
      }
    }
    
    const createBookingB = await makeRequest('POST', '/api/bookings', bookingB, {
      'X-Tenant-ID': testConfig.tenantB.slug,
      'Authorization': `Bearer ${testConfig.tenantB.token}`
    })
    assert(createBookingB.success, 'Booking created for Tenant B', createBookingB.error)
    
    let bookingBId = null
    if (createBookingB.success) {
      bookingBId = createBookingB.data.data._id || createBookingB.data.data.id
      assert(createBookingB.data.data.tenantId === testConfig.tenantB.id, 'Booking B has correct tenantId', {
        expected: testConfig.tenantB.id,
        actual: createBookingB.data.data.tenantId
      })
    }
    
    // Verifica isolamento: Tenant A non deve vedere prenotazioni di Tenant B
    const tenantABookings = await makeRequest('GET', '/api/bookings', null, {
      'X-Tenant-ID': testConfig.tenantA.slug,
      'Authorization': `Bearer ${testConfig.tenantA.token}`
    })
    
    if (tenantABookings.success) {
      const bookings = tenantABookings.data.data || tenantABookings.data
      const hasBookingB = bookings.some(b => b._id === bookingBId || b.id === bookingBId)
      assert(!hasBookingB, 'Tenant A cannot see Tenant B bookings')
      
      const hasBookingA = bookings.some(b => b._id === bookingAId || b.id === bookingAId)
      assert(hasBookingA, 'Tenant A can see its own bookings')
    }
    
    // Verifica isolamento: Tenant B non deve vedere prenotazioni di Tenant A
    const tenantBBookings = await makeRequest('GET', '/api/bookings', null, {
      'X-Tenant-ID': testConfig.tenantB.slug,
      'Authorization': `Bearer ${testConfig.tenantB.token}`
    })
    
    if (tenantBBookings.success) {
      const bookings = tenantBBookings.data.data || tenantBBookings.data
      const hasBookingA = bookings.some(b => b._id === bookingAId || b.id === bookingAId)
      assert(!hasBookingA, 'Tenant B cannot see Tenant A bookings')
      
      const hasBookingB = bookings.some(b => b._id === bookingBId || b.id === bookingBId)
      assert(hasBookingB, 'Tenant B can see its own bookings')
    }
    
    log.info('Data isolation tests completed')
  }
  
  static async testCrossTenantAccessPrevention() {
    log.title('5. Prevenzione Accesso Cross-Tenant')
    
    // Tentativo di accesso con token di Tenant A ma header di Tenant B
    const crossAccessAttempt = await makeRequest('GET', '/api/bookings', null, {
      'X-Tenant-ID': testConfig.tenantB.slug,
      'Authorization': `Bearer ${testConfig.tenantA.token}`
    })
    
    assert(!crossAccessAttempt.success || crossAccessAttempt.status === 403, 
           'Cross-tenant access properly blocked')
    
    // Tentativo di accesso a tenant info di altro tenant
    const crossTenantInfo = await makeRequest('GET', '/api/tenants/current', null, {
      'X-Tenant-ID': testConfig.tenantA.slug,
      'Authorization': `Bearer ${testConfig.tenantB.token}`
    })
    
    assert(!crossTenantInfo.success || crossTenantInfo.status === 403,
           'Cross-tenant info access properly blocked')
    
    log.info('Cross-tenant access prevention tests completed')
  }
  
  static async testTenantManagement() {
    log.title('6. Gestione Tenant')
    
    // Test ottenimento informazioni tenant corrente
    const tenantInfo = await makeRequest('GET', '/api/tenants/current', null, {
      'X-Tenant-ID': testConfig.tenantA.slug,
      'Authorization': `Bearer ${testConfig.tenantA.token}`
    })
    
    assert(tenantInfo.success, 'Can retrieve current tenant info', tenantInfo.error)
    if (tenantInfo.success) {
      assert(tenantInfo.data?.data?.slug === testConfig.tenantA.slug, 'Correct tenant info returned', tenantInfo.data)
      assert(tenantInfo.data?.data?.plan === 'trial', 'Default plan is trial', tenantInfo.data?.data)
    }
    
    // Test aggiornamento configurazione tenant
    const updateData = {
      name: 'Updated Tenant A Name',
      businessInfo: {
        type: 'sports_bar',
        address: {
          street: 'Via Roma 999',
          city: 'Milano',
          country: 'IT'
        }
      }
    }
    
    const updateResponse = await makeRequest('PUT', '/api/tenants/current', updateData, {
      'X-Tenant-ID': testConfig.tenantA.slug,
      'Authorization': `Bearer ${testConfig.tenantA.token}`
    })
    
    assert(updateResponse.success, 'Tenant configuration update successful', updateResponse.error)
    
    // Test cambio piano
    const planUpdate = await makeRequest('PUT', '/api/tenants/current/plan', { plan: 'basic' }, {
      'X-Tenant-ID': testConfig.tenantA.slug,
      'Authorization': `Bearer ${testConfig.tenantA.token}`
    })
    
    assert(planUpdate.success, 'Tenant plan update successful', planUpdate.error)
    
    // Test statistiche usage
    const usageStats = await makeRequest('GET', '/api/tenants/current/usage', null, {
      'X-Tenant-ID': testConfig.tenantA.slug,
      'Authorization': `Bearer ${testConfig.tenantA.token}`
    })
    
    assert(usageStats.success, 'Tenant usage statistics accessible', usageStats.error)
    if (usageStats.success) {
      assert(usageStats.data?.data?.current, 'Usage statistics contain current data', usageStats.data)
      assert(usageStats.data?.data?.limits, 'Usage statistics contain limits', usageStats.data)
    }
    
    log.info('Tenant management tests completed')
  }
  
  static async testSecurityFeatures() {
    log.title('7. Funzionalità di Sicurezza')
    
    // Test rate limiting (fai molte richieste rapidamente)
    const rapidRequests = []
    for (let i = 0; i < 10; i++) {
      rapidRequests.push(makeRequest('GET', '/api/health'))
    }
    
    const rateLimitResults = await Promise.all(rapidRequests)
    const hasRateLimit = rateLimitResults.some(r => r.status === 429)
    log.info(`Rate limiting: ${hasRateLimit ? 'Active' : 'Not triggered (low volume)'}`)
    
    // Test headers di sicurezza su diverse routes
    const securityHeadersTest = await makeRequest('GET', '/api/tenants/test')
    if (securityHeadersTest.success) {
      assert(securityHeadersTest.headers['content-security-policy'], 'CSP header present on API routes')
      assert(securityHeadersTest.headers['x-frame-options'], 'X-Frame-Options present on API routes')
    }
    
    // Test validazione input
    const invalidInput = await makeRequest('POST', '/api/tenants/register', {
      invalid: 'data',
      tenantInfo: null
    })
    assert(!invalidInput.success, 'Invalid input properly rejected')
    
    log.info('Security features tests completed')
  }
  
  static async runAllTests() {
    console.log(chalk.bold.magenta('\n🧪 SUITE DI TEST MULTI-TENANT SPOrTS\n'))
    
    try {
      await this.healthCheck()
      await this.testTenantRegistration()
      await this.testTenantContext()
      await this.testDataIsolation()
      await this.testCrossTenantAccessPrevention()
      await this.testTenantManagement()
      await this.testSecurityFeatures()
      
    } catch (error) {
      log.error(`Test suite failed with error: ${error.message}`)
      testResults.failed++
      testResults.errors.push(`Suite error: ${error.message}`)
    }
    
    // Risultati finali
    console.log('\n' + chalk.bold.yellow('📊 RISULTATI TEST'))
    console.log(chalk.green(`✅ Passed: ${testResults.passed}`))
    console.log(chalk.red(`❌ Failed: ${testResults.failed}`))
    console.log(chalk.blue(`📈 Total: ${testResults.total}`))
    
    const successRate = Math.round((testResults.passed / testResults.total) * 100)
    console.log(chalk.bold(`🎯 Success Rate: ${successRate}%`))
    
    if (testResults.failed > 0) {
      console.log('\n' + chalk.red('❌ ERRORI:'))
      testResults.errors.forEach(error => {
        console.log(chalk.red('  - ' + error))
      })
    }
    
    if (successRate >= 90) {
      console.log('\n' + chalk.green.bold('🎉 SISTEMA MULTI-TENANT VERIFICATO!'))
    } else if (successRate >= 70) {
      console.log('\n' + chalk.yellow.bold('⚠️  Sistema funziona ma richiede miglioramenti'))
    } else {
      console.log('\n' + chalk.red.bold('🚨 Sistema richiede correzioni importanti'))
    }
    
    return successRate >= 90
  }
}

// Avvia i test se eseguito direttamente
if (require.main === module) {
  MultiTenantTests.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error(chalk.red('Test suite crashed:', error))
      process.exit(1)
    })
}

module.exports = MultiTenantTests 