const axios = require('axios')

async function testOneTenant() {
  try {
    // Usa il tenant ID dal debug precedente
    const response = await axios.get('http://localhost:3001/api/tenants/current', {
      headers: {
        'X-Tenant-ID': 'debug-tenant'
      }
    })
    
    console.log('SUCCESS:', response.data)
  } catch (error) {
    console.log('ERROR:', {
      status: error.response?.status,
      data: error.response?.data
    })
  }
}

testOneTenant() 