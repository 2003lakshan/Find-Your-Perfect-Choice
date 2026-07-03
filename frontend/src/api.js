const API_URL = "https://find-your-perfect-choice-production.up.railway.app";

function getHeaders() {
  const token = localStorage.getItem('bodim_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getAuthHeader() {
  const token = localStorage.getItem('bodim_token');
  if (token) return { 'Authorization': `Bearer ${token}` };
  return {};
}

export const api = {
  // Auth
  async register(name, email, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('bodim_token', data.token);
    return data;
  },

  async googleLogin(credential) {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('bodim_token', data.token);
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (!data.requires2FA && !data.requires2FASetup) {
      localStorage.setItem('bodim_token', data.token);
    }
    return data;
  },

  async verify2FA(email, token) {
    const res = await fetch(`${API_URL}/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('bodim_token', data.token);
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  },

  logout() {
    localStorage.removeItem('bodim_token');
  },

  // Boardings
  async getBoardings(city, search) {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (search) params.set('search', search);
    const res = await fetch(`${API_URL}/boardings?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    // Prefix image URLs with backend host
    return data.map(b => ({
      ...b,
      images: b.images.map(img => `http://localhost:5000${img}`)
    }));
  },

  async getMyListings() {
    const res = await fetch(`${API_URL}/boardings/my-listings`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.map(b => ({
      ...b,
      images: b.images.map(img => `http://localhost:5000${img}`),
      payment_receipt: b.payment_receipt ? `http://localhost:5000/uploads/${b.payment_receipt}` : null
    }));
  },

  async getBoarding(id) {
    const res = await fetch(`${API_URL}/boardings/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    data.images = data.images.map(img => `http://localhost:5000${img}`);
    return data;
  },

  async createBoarding(formData) {
    const res = await fetch(`${API_URL}/boardings`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData // FormData for file upload
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async deleteBoarding(id) {
    const res = await fetch(`${API_URL}/boardings/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  // Users (Admin)
  async getUsers() {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async deleteUser(id) {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  // Admin Boardings
  async getAdminBoardings() {
    const res = await fetch(`${API_URL}/boardings/admin/all`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.map(b => ({
      ...b,
      images: b.images.map(img => `http://localhost:5000${img}`),
      payment_receipt: b.payment_receipt ? `http://localhost:5000/uploads/${b.payment_receipt}` : null
    }));
  },

  async updateBoardingStatus(id, status) {
    const res = await fetch(`${API_URL}/boardings/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async updateBoarding(id, boardingData) {
    const res = await fetch(`${API_URL}/boardings/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(boardingData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }
};
