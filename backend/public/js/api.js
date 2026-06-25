const API_URL = '/api/v1';
let token = localStorage.getItem('gg_token') || '';

if (token) {
  document.getElementById('login-screen').classList.add('d-none');
  setTimeout(() => loadDashboardKpis(), 100);
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      token = data.accessToken;
      localStorage.setItem('gg_token', token);
      document.getElementById('login-screen').classList.add('d-none');
      document.getElementById('login-error').style.display = 'none';
      loadDashboardKpis();
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  } catch (err) {
    console.error('Login failed', err);
  }
}

async function logout() {
  await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
  token = '';
  localStorage.removeItem('gg_token');
  document.getElementById('login-screen').classList.remove('d-none');
}

// Utility to handle fetch with auth
async function fetchApi(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  if (res.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }
  
  if (!res.ok) throw new Error(await res.text());
  
  const json = await res.json();
  // NestJS TransformInterceptor wraps everything in { data: ..., statusCode: ... }
  return json.data !== undefined ? json.data : json;
}
