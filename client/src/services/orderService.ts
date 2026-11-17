import { api } from './api';
import { CartItem, Address, Order } from '../types';

export const orderService = {
  createRazorpayOrder: async (items: CartItem[], couponCode?: string, shippingAddress?: Address) => {
    const res = await api.post('/orders/razorpay', { items, couponCode, shippingAddress });
    return res.data;
  },

  verifyOrderPayment: async (
    orderId: string,
    data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }
  ): Promise<{ success: boolean; data: Order; message: string }> => {
    const res = await api.post(`/orders/${orderId}/verify-payment`, data);
    return res.data;
  },

  /** Legacy / combined verifyPayment helper */
  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    items?: CartItem[];
    shippingAddress?: Address;
    couponCode?: string;
    orderId?: string;
  }): Promise<{ success: boolean; data: Order; message: string }> => {
    if (data.orderId) {
      return orderService.verifyOrderPayment(data.orderId, {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });
    }
    // Fallback if called directly without orderId
    const res = await api.post('/orders/verify-payment', data);
    return res.data;
  },

  retryOrderPayment: async (
    orderId: string
  ): Promise<{
    success: boolean;
    data: {
      alreadyPaid: boolean;
      order: Order;
      razorpayOrder?: { id: string; amount: number; currency: string; isMock?: boolean };
      keyId?: string;
    };
    message?: string;
  }> => {
    const res = await api.post(`/orders/${orderId}/pay`);
    return res.data;
  },

  recordPaymentFailure: async (orderId: string, reason?: string) => {
    const res = await api.post(`/orders/${orderId}/payment-failed`, { reason });
    return res.data;
  },

  cancelOrder: async (
    orderId: string,
    reason: string,
    note?: string
  ): Promise<{ success: boolean; data: Order; message: string }> => {
    const res = await api.put(`/orders/${orderId}/cancel`, { reason, note });
    return res.data;
  },

  createCODOrder: async (data: {
    items: CartItem[];
    shippingAddress: Address;
    couponCode?: string;
  }): Promise<{ success: boolean; data: Order; message: string }> => {
    const res = await api.post('/orders/cod', data);
    return res.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const res = await api.get('/orders/my-orders');
    return res.data.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const res = await api.get(`/orders/${id}`);
    return res.data.data;
  },

  getAllOrders: async (params?: {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/orders', { params });
    return res.data;
  },

  updateOrderStatus: async (
    id: string,
    data: {
      status?: string;
      trackingNumber?: string;
      note?: string;
      reason?: string;
      courierName?: string;
      trackingUrl?: string;
    }
  ) => {
    const res = await api.put(`/orders/${id}/status`, data);
    return res.data;
  },

  syncOrderPayment: async (id: string) => {
    const res = await api.post(`/orders/${id}/sync-payment`);
    return res.data;
  },

  collectCodPayment: async (id: string): Promise<{ success: boolean; data: Order; message: string }> => {
    const res = await api.post(`/orders/${id}/collect-cod`);
    return res.data;
  },

  getShiprocketTracking: async (id: string) => {
    const res = await api.get(`/orders/${id}/shiprocket/track`);
    return res.data.data;
  },

  createShiprocketOrder: async (id: string) => {
    const res = await api.post(`/orders/${id}/shiprocket/create`);
    return res.data;
  },

  getInvoiceUrl: (id: string, autoPrint = false) => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${base}/orders/${id}/invoice${autoPrint ? '?print=true' : ''}`;
  },
};
