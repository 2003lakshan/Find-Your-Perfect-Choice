const IS_DEV = import.meta.env.DEV;
const SERVER_URL = IS_DEV ? "http://localhost:5000" : "https://find-your-perfect-choice-production.up.railway.app";
const API_URL = `${SERVER_URL}/api`;

function getHeaders() {
  const token = localStorage.getItem("bodim_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function getAuthHeader() {
  const token = localStorage.getItem("bodim_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fixImageUrl(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${SERVER_URL}${img}`;
}

export const api = {
  async register(name, email, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    localStorage.setItem("bodim_token", data.token);
    return data;
  },

  async googleLogin(credential) {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Google login failed");

    localStorage.setItem("bodim_token", data.token);
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    if (!data.requires2FA && !data.requires2FASetup) {
      localStorage.setItem("bodim_token", data.token);
    }

    return data;
  },

  async sendOtpLogin(email) {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send OTP email");
    return data;
  },

  async verifyOtpLogin(email, otp) {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "OTP verification failed");
    
    // Save token as this logs the user in
    localStorage.setItem("bodim_token", data.token);
    return data;
  },

  async verify2FA(email, token) {
    const res = await fetch(`${API_URL}/auth/verify-2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "2FA verification failed");

    localStorage.setItem("bodim_token", data.token);
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders()
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user;
  },

  logout() {
    localStorage.removeItem("bodim_token");
  },

  async getBoardings(city, search) {
    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (search) params.set("search", search);

    const res = await fetch(`${API_URL}/boardings?${params}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch boardings");

    return data.map((b) => ({
      ...b,
      images: b.images.map(fixImageUrl)
    }));
  },

  async getMyListings() {
    const res = await fetch(`${API_URL}/boardings/my-listings`, {
      headers: getHeaders()
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch listings");

    return data.map((b) => ({
      ...b,
      images: b.images.map(fixImageUrl),
      payment_receipt: b.payment_receipt
        ? `${SERVER_URL}/uploads/${b.payment_receipt}`
        : null
    }));
  },

  async getBoarding(id) {
    const res = await fetch(`${API_URL}/boardings/${id}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch boarding");

    return {
      ...data,
      images: data.images.map(fixImageUrl)
    };
  },

  async createBoarding(formData) {
    const res = await fetch(`${API_URL}/boardings`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to create boarding");

    return data;
  },

  async deleteBoarding(id) {
    const res = await fetch(`${API_URL}/boardings/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to delete boarding");

    return data;
  },

  async getUsers() {
    const res = await fetch(`${API_URL}/users`, {
      headers: getHeaders()
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch users");

    return data;
  },

  async deleteUser(id) {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to delete user");

    return data;
  },

  async updateUserRole(id, role) {
    const res = await fetch(`${API_URL}/users/${id}/role`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update user role");
    return data;
  },

  async getAdminBoardings() {
    const res = await fetch(`${API_URL}/boardings/admin/all`, {
      headers: getHeaders()
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch admin boardings");

    return data.map((b) => ({
      ...b,
      images: b.images.map(fixImageUrl),
      payment_receipt: b.payment_receipt
        ? `${SERVER_URL}/uploads/${b.payment_receipt}`
        : null
    }));
  },

  async updateBoardingStatus(id, status) {
    const res = await fetch(`${API_URL}/boardings/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to update status");

    return data;
  },

  async updateBoarding(id, boardingData) {
    const res = await fetch(`${API_URL}/boardings/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(boardingData)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to update boarding");

    return data;
  }
,
  // --- Vehicles ---
  async getVehicles(city, search) {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (search) params.set("search", search);
    const res = await fetch(`${API_URL}/vehicles?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch vehicles");
    return data.map((v) => ({ ...v, images: v.images.map(fixImageUrl) }));
  },
  async getMyVehicles() {
    const res = await fetch(`${API_URL}/vehicles/my-listings`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch vehicles");
    return data.map((v) => ({
      ...v,
      images: v.images.map(fixImageUrl),
      payment_receipt: v.payment_receipt ? `${SERVER_URL}/uploads/${v.payment_receipt}` : null
    }));
  },
  async getVehicle(id) {
    const res = await fetch(`${API_URL}/vehicles/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch vehicle");
    return { ...data, images: data.images.map(fixImageUrl) };
  },
  async createVehicle(formData) {
    const res = await fetch(`${API_URL}/vehicles`, {
      method: "POST", headers: getAuthHeader(), body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create vehicle");
    return data;
  },
  async deleteVehicle(id) {
    const res = await fetch(`${API_URL}/vehicles/${id}`, {
      method: "DELETE", headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete vehicle");
    return data;
  },
  async getAdminVehicles() {
    const res = await fetch(`${API_URL}/vehicles/admin/all`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch admin vehicles");
    return data.map((v) => ({
      ...v,
      images: v.images.map(fixImageUrl),
      payment_receipt: v.payment_receipt ? `${SERVER_URL}/uploads/${v.payment_receipt}` : null
    }));
  },
  async updateVehicleStatus(id, status) {
    const res = await fetch(`${API_URL}/vehicles/${id}/status`, {
      method: "PATCH", headers: getHeaders(), body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update status");
    return data;
  },
  async updateVehicle(id, vehicleData) {
    const res = await fetch(`${API_URL}/vehicles/${id}`, {
      method: "PUT", headers: getHeaders(), body: JSON.stringify(vehicleData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update vehicle");
    return data;
  },

  // --- Lands ---
  async getLands(city, search) {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (search) params.set("search", search);
    const res = await fetch(`${API_URL}/lands?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch lands");
    return data.map((l) => ({ ...l, images: l.images.map(fixImageUrl) }));
  },
  async getMyLands() {
    const res = await fetch(`${API_URL}/lands/my-listings`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch lands");
    return data.map((l) => ({
      ...l,
      images: l.images.map(fixImageUrl),
      payment_receipt: l.payment_receipt ? `${SERVER_URL}/uploads/${l.payment_receipt}` : null
    }));
  },
  async getLand(id) {
    const res = await fetch(`${API_URL}/lands/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch land");
    return { ...data, images: data.images.map(fixImageUrl) };
  },
  async createLand(formData) {
    const res = await fetch(`${API_URL}/lands`, {
      method: "POST", headers: getAuthHeader(), body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create land");
    return data;
  },
  async deleteLand(id) {
    const res = await fetch(`${API_URL}/lands/${id}`, {
      method: "DELETE", headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete land");
    return data;
  },
  async getAdminLands() {
    const res = await fetch(`${API_URL}/lands/admin/all`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch admin lands");
    return data.map((l) => ({
      ...l,
      images: l.images.map(fixImageUrl),
      payment_receipt: l.payment_receipt ? `${SERVER_URL}/uploads/${l.payment_receipt}` : null
    }));
  },
  async updateLandStatus(id, status) {
    const res = await fetch(`${API_URL}/lands/${id}/status`, {
      method: "PATCH", headers: getHeaders(), body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update status");
    return data;
  },
  async updateLand(id, landData) {
    const res = await fetch(`${API_URL}/lands/${id}`, {
      method: "PUT", headers: getHeaders(), body: JSON.stringify(landData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update land");
    return data;
  },

  // --- Notifications ---
  async getNotifications() {
    const res = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch notifications");
    return data;
  },
  async markNotificationAsRead(id) {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "PATCH", headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to mark notification as read");
    return data;
  },
  async markAllNotificationsAsRead() {
    const res = await fetch(`${API_URL}/notifications/read-all`, {
      method: "PATCH", headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to mark all as read");
    return data;
  },

  // --- Reviews ---
  async getAllReviews() {
    const res = await fetch(`${API_URL}/reviews`, { headers: getAuthHeader() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch all reviews");
    return data;
  },
  async getReviews(type, id) {
    const res = await fetch(`${API_URL}/reviews/${type}/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch reviews");
    return data;
  },
  async addReview(reviewData) {
    const res = await fetch(`${API_URL}/reviews`, {
      method: "POST", headers: getHeaders(), body: JSON.stringify(reviewData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add review");
    return data;
  },
  async editReviewByAdmin(id, comment) {
    const res = await fetch(`${API_URL}/reviews/${id}`, {
      method: "PATCH", headers: getHeaders(), body: JSON.stringify({ comment })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update review");
    return data;
  }
};
