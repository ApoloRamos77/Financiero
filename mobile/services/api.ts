import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/theme';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, JSON.stringify(refreshToken), {
            headers: { 'Content-Type': 'application/json' },
          });
          await SecureStore.setItemAsync('accessToken', data.accessToken);
          await SecureStore.setItemAsync('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  setup: (data: object) =>
    api.post('/auth/setup', data).then(r => r.data),
  refresh: (token: string) =>
    api.post('/auth/refresh', token).then(r => r.data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', refreshToken),
  createContributorUser: (contributorId: string, data: object) =>
    api.post(`/auth/contributors/${contributorId}/user`, data).then(r => r.data),
  resetPassword: (contributorId: string, data: object) =>
    api.post(`/auth/contributors/${contributorId}/reset-password`, data),
  changePassword: (data: object) =>
    api.post('/auth/change-password', data),
};

// ─── Family ───────────────────────────────────────────────────
export const familyService = {
  get: () => api.get('/family').then(r => r.data),
  update: (data: object) => api.put('/family', data).then(r => r.data),
};

// ─── Dashboard ────────────────────────────────────────────────
export const dashboardService = {
  getSummary: (year?: number, month?: number) =>
    api.get('/dashboard/summary', { params: { year, month } }).then(r => r.data),
  getCharts: (year?: number, month?: number) =>
    api.get('/dashboard/charts', { params: { year, month } }).then(r => r.data),
};

// ─── Movements ────────────────────────────────────────────────
export const movementService = {
  getAll: (filter?: object) =>
    api.get('/movements', { params: filter }).then(r => r.data),
  getById: (id: string) =>
    api.get(`/movements/${id}`).then(r => r.data),
  create: (data: object) =>
    api.post('/movements', data).then(r => r.data),
  update: (id: string, data: object) =>
    api.put(`/movements/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/movements/${id}`),
  getCalendar: (year: number, month: number) =>
    api.get(`/movements/calendar/${year}/${month}`).then(r => r.data),
  getCompliance: (year: number, month: number) =>
    api.get(`/movements/compliance/${year}/${month}`).then(r => r.data),
};

// ─── Contributors ─────────────────────────────────────────────
export const contributorService = {
  getAll: () => api.get('/contributors').then(r => r.data),
  getById: (id: string) => api.get(`/contributors/${id}`).then(r => r.data),
  create: (data: object) => api.post('/contributors', data).then(r => r.data),
  update: (id: string, data: object) => api.put(`/contributors/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/contributors/${id}`),
};

// ─── Ventures ─────────────────────────────────────────────────
export const ventureService = {
  getAll: () => api.get('/ventures').then(r => r.data),
  getSummary: (id: string) => api.get(`/ventures/${id}/summary`).then(r => r.data),
  create: (data: object) => api.post('/ventures', data).then(r => r.data),
  update: (id: string, data: object) => api.put(`/ventures/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/ventures/${id}`),
};

// ─── Categories ───────────────────────────────────────────────
export const categoryService = {
  getAll: () => api.get('/categories').then(r => r.data),
  create: (data: object) => api.post('/categories', data).then(r => r.data),
  update: (id: string, data: object) => api.put(`/categories/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ─── Accounts ─────────────────────────────────────────────────
export const accountService = {
  getAll: () => api.get('/accounts').then(r => r.data),
  create: (data: object) => api.post('/accounts', data).then(r => r.data),
  update: (id: string, data: object) => api.put(`/accounts/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
};

// ─── Goals ────────────────────────────────────────────────────
export const goalService = {
  getAll: () => api.get('/goals').then(r => r.data),
  create: (data: object) => api.post('/goals', data).then(r => r.data),
  update: (id: string, data: object) => api.put(`/goals/${id}`, data).then(r => r.data),
  updateAmount: (id: string, amount: number) => api.patch(`/goals/${id}/amount`, amount).then(r => r.data),
  delete: (id: string) => api.delete(`/goals/${id}`),
};

// ─── Alerts ───────────────────────────────────────────────────
export const alertService = {
  getAll: () => api.get('/alerts').then(r => r.data),
  markAsRead: (id: string) => api.patch(`/alerts/${id}/read`),
  dismiss: (id: string) => api.patch(`/alerts/${id}/dismiss`),
  getConfigs: () => api.get('/alerts/configs').then(r => r.data),
  updateConfig: (id: string, data: object) => api.put(`/alerts/configs/${id}`, data),
  generate: () => api.post('/alerts/generate'),
};

// ─── Reports ──────────────────────────────────────────────────
export const reportService = {
  getMonthly: (year: number, month: number) =>
    api.get(`/reports/monthly/${year}/${month}`).then(r => r.data),
  getAnnual: (year: number) =>
    api.get(`/reports/annual/${year}`).then(r => r.data),
  exportCsv: (filter?: object) =>
    api.get('/reports/export/csv', { params: filter, responseType: 'blob' }).then(r => r.data),
  exportPdf: (year: number, month: number) =>
    api.get(`/reports/export/pdf/${year}/${month}`, { responseType: 'blob' }).then(r => r.data),
};

// ─── Analysis ─────────────────────────────────────────────────
export const analysisService = {
  getInsights: () => api.get('/analysis/insights').then(r => r.data),
};

// ─── Users ────────────────────────────────────────────────────
export const userService = {
  getAll: () => api.get('/users').then(r => r.data),
  getById: (id: string) => api.get(`/users/${id}`).then(r => r.data),
  create: (data: object) => api.post('/users', data).then(r => r.data),
  update: (id: string, data: object) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
