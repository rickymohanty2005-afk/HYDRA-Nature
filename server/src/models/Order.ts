import mongoose, { Document, Schema } from 'mongoose';
import { IAddress } from './User';
import {
  ACTORS,
  Actor,
  ORDER_STATUSES,
  OrderStatus,
  PAYMENT_STATUSES,
  PaymentStatus,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from '../constants/orderStatus';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

export interface ITrackingEvent {
  status: string;
  message: string;
  actor?: Actor;
  timestamp: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IAddress;
  /** Checkout channel: online gateway or cash on delivery */
  paymentMethod: 'razorpay' | 'cod' | 'card';
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    /** Instrument actually used on the gateway: upi | card | netbanking | wallet | emi | paylater */
    method?: string;
    paidAt?: Date;
    attempts?: number;
    lastAttemptAt?: Date;
    failureReason?: string;
    /** Every Razorpay order id ever issued for this order (retries) — used for reconciliation */
    gatewayOrderHistory?: string[];
  };
  /** Online orders must be paid before this time or they are auto-cancelled & restocked */
  paymentExpiresAt?: Date;
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode?: string;
  tax: number;
  total: number;
  status: OrderStatus;
  trackingNumber?: string;
  trackingHistory: ITrackingEvent[];
  cancellation?: {
    reason?: string;
    note?: string;
    cancelledBy?: Actor;
    cancelledAt?: Date;
  };
  refund?: {
    refundId?: string;
    amount?: number;
    status?: 'pending' | 'processed' | 'failed';
    initiatedAt?: Date;
    processedAt?: Date;
    failureReason?: string;
  };
  /** Idempotency guards */
  stockRestored?: boolean;
  couponReleased?: boolean;
  shiprocket?: {
    shiprocketOrderId?: string;
    shipmentId?: string;
    awbCode?: string;
    courierName?: string;
    currentStatus?: string;
    trackingUrl?: string;
    etd?: string;
    pickupScheduledDate?: string;
    pickupTokenNumber?: string;
    activities?: {
      date: string;
      status: string;
      activity: string;
      location: string;
    }[];
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
  size: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [OrderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      apartment: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod', 'card'],
      default: 'razorpay',
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      method: String,
      paidAt: Date,
      attempts: { type: Number, default: 0 },
      lastAttemptAt: Date,
      failureReason: String,
      gatewayOrderHistory: [String],
    },
    paymentExpiresAt: { type: Date },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'placed',
    },
    trackingNumber: { type: String },
    trackingHistory: [
      {
        status: String,
        message: String,
        actor: { type: String, enum: ACTORS, default: 'system' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    cancellation: {
      reason: String,
      note: String,
      cancelledBy: { type: String, enum: ACTORS },
      cancelledAt: Date,
    },
    refund: {
      refundId: String,
      amount: Number,
      status: { type: String, enum: ['pending', 'processed', 'failed'] },
      initiatedAt: Date,
      processedAt: Date,
      failureReason: String,
    },
    stockRestored: { type: Boolean, default: false },
    couponReleased: { type: Boolean, default: false },
    shiprocket: {
      shiprocketOrderId: String,
      shipmentId: String,
      awbCode: String,
      courierName: String,
      currentStatus: String,
      trackingUrl: String,
      etd: String,
      pickupScheduledDate: String,
      pickupTokenNumber: String,
      activities: [
        {
          date: String,
          status: String,
          activity: String,
          location: String,
        },
      ],
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

/**
 * Defensive normalisation — guarantees legacy values (e.g. "ORDER_CONFIRMED",
 * "completed") can never be persisted again, even by older code paths.
 */
OrderSchema.pre('validate', function (next) {
  this.status = normalizeOrderStatus(this.status);
  this.paymentStatus = normalizePaymentStatus(this.paymentStatus);
  next();
});

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'paymentDetails.razorpayOrderId': 1 });
OrderSchema.index({ paymentStatus: 1, paymentExpiresAt: 1 });
OrderSchema.index({ trackingNumber: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
