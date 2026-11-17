import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  isCartOpen: boolean;
}

const loadSavedCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('hydra_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const loadSavedCoupon = (): { code: string | null; discount: number } => {
  try {
    const saved = localStorage.getItem('hydra_coupon');
    return saved ? JSON.parse(saved) : { code: null, discount: 0 };
  } catch {
    return { code: null, discount: 0 };
  }
};

const calculateTotals = (items: CartItem[], discount: number = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 0; // Free express shipping on all orders
  const tax = 0; // GST reduced / included in formulation prices
  const total = Math.max(0, subtotal - discount);

  return { subtotal, shippingFee, tax, total };
};

const initialItems = loadSavedCart();
const initialCoupon = loadSavedCoupon();
const initialTotals = calculateTotals(initialItems, initialCoupon.discount);

const initialState: CartState = {
  items: initialItems,
  couponCode: initialCoupon.code,
  discount: initialCoupon.discount,
  subtotal: initialTotals.subtotal,
  shippingFee: initialTotals.shippingFee,
  tax: initialTotals.tax,
  total: initialTotals.total,
  isCartOpen: false,
};

const saveCartToStorage = (items: CartItem[]) => {
  localStorage.setItem('hydra_cart', JSON.stringify(items));
};

const saveCouponToStorage = (code: string | null, discount: number) => {
  if (code) {
    localStorage.setItem('hydra_coupon', JSON.stringify({ code, discount }));
  } else {
    localStorage.removeItem('hydra_coupon');
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId && i.size === action.payload.size
      );

      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      saveCartToStorage(state.items);
      const totals = calculateTotals(state.items, state.discount);
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.tax = totals.tax;
      state.total = totals.total;
    },

    removeFromCart: (state, action: PayloadAction<{ productId: string; size?: string }>) => {
      state.items = state.items.filter(
        (i) => !(i.productId === action.payload.productId && i.size === action.payload.size)
      );

      saveCartToStorage(state.items);
      const totals = calculateTotals(state.items, state.discount);
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.tax = totals.tax;
      state.total = totals.total;
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number; size?: string }>
    ) => {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId && i.size === action.payload.size
      );
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(
            (i) => !(i.productId === action.payload.productId && i.size === action.payload.size)
          );
        } else {
          item.quantity = action.payload.quantity;
        }
      }

      saveCartToStorage(state.items);
      const totals = calculateTotals(state.items, state.discount);
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.tax = totals.tax;
      state.total = totals.total;
    },

    applyCoupon: (state, action: PayloadAction<{ code: string; discount: number }>) => {
      state.couponCode = action.payload.code;
      state.discount = action.payload.discount;
      saveCouponToStorage(state.couponCode, state.discount);

      const totals = calculateTotals(state.items, state.discount);
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.tax = totals.tax;
      state.total = totals.total;
    },

    removeCoupon: (state) => {
      state.couponCode = null;
      state.discount = 0;
      saveCouponToStorage(null, 0);

      const totals = calculateTotals(state.items, 0);
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.tax = totals.tax;
      state.total = totals.total;
    },

    clearCart: (state) => {
      state.items = [];
      state.couponCode = null;
      state.discount = 0;
      state.subtotal = 0;
      state.shippingFee = 0;
      state.tax = 0;
      state.total = 0;
      localStorage.removeItem('hydra_cart');
      localStorage.removeItem('hydra_coupon');
    },

    toggleCartDrawer: (state, action: PayloadAction<boolean | undefined>) => {
      state.isCartOpen = action.payload !== undefined ? action.payload : !state.isCartOpen;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
  toggleCartDrawer,
} = cartSlice.actions;

export default cartSlice.reducer;
