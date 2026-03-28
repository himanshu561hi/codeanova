const axios = require('axios');

async function test() {
  try {
    // Admin login is in /api/admin/login
    const adminLoginRes = await axios.post('http://localhost:5005/api/admin/login', {
      email: 'himanshu561hi@gmail.com',
      password: 'Himanshu@80'
    });

    const token = adminLoginRes.data.token;
    console.log('LOGGED IN, TOKEN:', token);

    const res = await axios.post('http://localhost:5005/api/broadcast/create', 
      { message: 'Test Broadcast from Script' },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('CREATE RESPONSE:', res.data);
  } catch (err) {
    console.error('TEST FAILED:', err.response?.data || err.message);
  }
}
test();
