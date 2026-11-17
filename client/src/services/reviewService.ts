import { api } from './api';
import { Review } from '../types';

export const reviewService = {
  getByProduct: async (productId: string): Promise<Review[]> => {
    const res = await api.get(`/reviews/${productId}`);
    return res.data.data;
  },

  create: async (
    productId: string,
    data: { rating: number; title: string; comment: string; images?: string[] } | FormData
  ) => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const res = await api.post(`/reviews/${productId}`, data, {
      headers: isFormData
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' },
    });
    return res.data;
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const res = await api.post('/reviews/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.relativeUrls || res.data.imageUrls || [];
  },

  delete: async (reviewId: string) => {
    const res = await api.delete(`/reviews/${reviewId}`);
    return res.data;
  },
};
