import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreVisitItem {
  product?: mongoose.Types.ObjectId;
  name: string;
  sku?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IStoreVisitInvoice extends Document {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  storeLocation: string;
  items: IStoreVisitItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'netbanking';
  paymentStatus: 'paid' | 'pending';
  notes?: string;
  servedBy?: mongoose.Types.ObjectId;
  servedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreVisitItemSchema = new Schema<IStoreVisitItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
      default: 'Standard',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const StoreVisitInvoiceSchema = new Schema<IStoreVisitInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    customerAddress: {
      type: String,
      trim: true,
      default: '',
    },
    storeLocation: {
      type: String,
      trim: true,
      default: 'Hydra Flagship Boutique',
    },
    items: {
      type: [StoreVisitItemSchema],
      required: [true, 'At least one purchase item is required'],
      validate: [
        (val: IStoreVisitItem[]) => val && val.length > 0,
        'Invoice must contain at least 1 item',
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0, // e.g. 18 for 18% GST or 0 for inclusive
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'netbanking'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'paid',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    servedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    servedByName: {
      type: String,
      default: 'Admin Staff',
    },
  },
  {
    timestamps: true,
  }
);

StoreVisitInvoiceSchema.index({ invoiceNumber: 1 });
StoreVisitInvoiceSchema.index({ customerPhone: 1 });
StoreVisitInvoiceSchema.index({ createdAt: -1 });

export const StoreVisitInvoice = mongoose.model<IStoreVisitInvoice>(
  'StoreVisitInvoice',
  StoreVisitInvoiceSchema
);
