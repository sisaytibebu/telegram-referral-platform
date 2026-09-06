import api from './api';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const adminLogin = (username: string, password: string) =>
  api.post('/admin/login', { username, password }).then(r => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = () =>
  api.get('/admin/dashboard').then(r => r.data);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = (params?: object) =>
  api.get('/admin/users', { params }).then(r => r.data);

export const getUserById = (id: number) =>
  api.get(`/admin/users/${id}`).then(r => r.data);

// ── Referrals ─────────────────────────────────────────────────────────────────
export const getReferrals = (params?: object) =>
  api.get('/admin/referrals', { params }).then(r => r.data);

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions = (params?: object) =>
  api.get('/admin/transactions', { params }).then(r => r.data);

// ── Withdrawals ───────────────────────────────────────────────────────────────
export const getWithdrawals = (params?: object) =>
  api.get('/admin/withdrawals', { params }).then(r => r.data);

export const approveWithdrawal = (id: number) =>
  api.post(`/admin/withdrawals/${id}/approve`).then(r => r.data);

export const rejectWithdrawal = (id: number, note: string) =>
  api.post(`/admin/withdrawals/${id}/reject`, { note }).then(r => r.data);

// ── Requirements ──────────────────────────────────────────────────────────────
export const getRequirements = () =>
  api.get('/admin/requirements').then(r => r.data);

export const createRequirement = (data: object) =>
  api.post('/admin/requirements', data).then(r => r.data);

export const updateRequirement = (id: number, data: object) =>
  api.put(`/admin/requirements/${id}`, data).then(r => r.data);

export const deleteRequirement = (id: number) =>
  api.delete(`/admin/requirements/${id}`).then(r => r.data);

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () =>
  api.get('/admin/settings').then(r => r.data);

export const updateSettings = (data: object) =>
  api.put('/admin/settings', data).then(r => r.data);

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const getAuditLogs = (params?: object) =>
  api.get('/admin/audit-logs', { params }).then(r => r.data);
