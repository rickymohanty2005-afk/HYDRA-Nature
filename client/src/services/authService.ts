import { api } from './api';
import { User, Address } from '../types';

export const authService = {
  register: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const res = await api.post('/auth/register', data);
    if (res.data.token) {
      localStorage.setItem('hydra_token', res.data.token);
    }
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post('/auth/login', data);
    if (res.data.token) {
      localStorage.setItem('hydra_token', res.data.token);
    }
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('hydra_token');
    }
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me', { timeout: 12000 });
    return res.data.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const res = await api.put('/auth/profile', data);
    return res.data.data;
  },

  // Address Management
  addAddress: async (address: Omit<Address, '_id'>) => {
    const res = await api.post('/auth/addresses', address);
    return res.data;
  },

  updateAddress: async (addressId: string, address: Partial<Address>) => {
    const res = await api.put(`/auth/addresses/${addressId}`, address);
    return res.data;
  },

  deleteAddress: async (addressId: string) => {
    const res = await api.delete(`/auth/addresses/${addressId}`);
    return res.data;
  },

  setDefaultAddress: async (addressId: string) => {
    const res = await api.patch(`/auth/addresses/${addressId}/primary`);
    return res.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data: { token: string; password: string }) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};
