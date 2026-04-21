import axios from 'axios';

const TOKEN_KEY = 'medicare_ai_token';
const USER_KEY = 'medicare_ai_user';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL
  || 'https://medicare-ai-health-platform-2.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getApiError = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

export const persistSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export const authApi = {
  async signup(payload) {
    const response = await api.post('/api/auth/signup', payload);
    return response.data.data;
  },
  async login(payload) {
    const response = await api.post('/api/auth/login', payload);
    return response.data.data;
  },
  async profile() {
    const response = await api.get('/api/auth/profile');
    return response.data.data;
  },
  async updateProfile(payload) {
    const response = await api.patch('/api/auth/profile', payload);
    return response.data.data;
  },
};

export const symptomApi = {
  async check(payload) {
    const response = await api.post('/api/symptom/check', payload);
    return response.data.data;
  },
  async history() {
    const response = await api.get('/api/symptom/history');
    return response.data.data;
  },
};

export const reportApi = {
  async analyze(formData) {
    const response = await api.post('/api/report/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },
  async history() {
    const response = await api.get('/api/report/history');
    return response.data.data;
  },
};

export const medicineApi = {
  async comparePrices(formData) {
    const response = await api.post('/api/medicine/compare-prices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },
};

export const reminderApi = {
  async create(payload) {
    const response = await api.post('/api/reminder/create', payload);
    return response.data.data;
  },
  async list() {
    const response = await api.get('/api/reminder/list');
    return response.data.data;
  },
  async remove(reminderId) {
    const response = await api.delete(`/api/reminder/${reminderId}`);
    return response.data.data;
  },
};

export const emergencyApi = {
  async trigger(payload) {
    const response = await api.post('/api/emergency/sos', payload);
    return response.data.data;
  },
};

export const chatbotApi = {
  async ask(payload) {
    const response = await api.post('/api/chatbot/ask', payload);
    return response.data.data;
  },
};

export const appointmentApi = {
  async book(payload) {
    const response = await api.post('/api/appointment/book', payload);
    return response.data.data;
  },
  async join(appointmentId) {
    const response = await api.get(`/api/appointment/${appointmentId}/join`);
    return response.data.data;
  },
  async payDemo(appointmentId, payload) {
    const response = await api.post(`/api/appointment/${appointmentId}/pay-demo`, payload);
    return response.data.data;
  },
  async list() {
    const response = await api.get('/api/appointment/list');
    return response.data.data;
  },
};

export default api;
