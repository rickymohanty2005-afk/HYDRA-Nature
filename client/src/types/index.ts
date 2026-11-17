export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  avatar?: string;
  addresses?: Address[];
  createdAt: string;
}

export interface Address {
  _id?: string;
  fullName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
  label?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage?: number;
  category: string;
  subcategory?: string;
  tag?: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  ingredients: string[];
  keyBenefits: string[];
  howToUse: string[];
  size?: string;
  skinType?: string[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  product?: Product;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  size?: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; name: string; email: string; phone?: string };
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'razorpay' | 'cod' | 'card' | 'upi' | 'netbanking' | string;
  paymentStatus: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded' | string;
  paymentDetails?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    method?: string;
    paidAt?: string;
    attempts?: number;
    lastAttemptAt?: string;
    failureReason?: string;
  };
  paymentExpiresAt?: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode?: string;
  tax: number;
  total: number;
  status:
    | 'placed'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'ORDER_PLACED'
    | 'ORDER_CONFIRMED'
    | 'SHIPROCKET_CREATED'
    | 'PICKUP_SCHEDULED'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'Pending'
    | 'Processing'
    | 'Shipped'
    | 'Delivered'
    | 'Cancelled'
    | string;
  trackingNumber?: string;
  trackingHistory?: {
    status: string;
    message: string;
    actor?: 'customer' | 'admin' | 'system' | string;
    timestamp: string;
  }[];
  cancellation?: {
    reason?: string;
    note?: string;
    cancelledBy?: 'customer' | 'admin' | 'system' | string;
    cancelledAt?: string;
  };
  refund?: {
    refundId?: string;
    amount?: number;
    status?: 'pending' | 'processed' | 'failed' | string;
    initiatedAt?: string;
    processedAt?: string;
    failureReason?: string;
  };
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
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  product: string | { _id: string; name: string; images?: string[]; category?: string; slug?: string };
  user: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: 'Skincare Tips' | 'Beauty Trends' | 'Wellness' | 'Ingredients';
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  readTime: string;
  tags: string[];
  publishedAt: string;
}

export interface Career {
  _id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Hybrid';
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  isActive: boolean;
  createdAt: string;
  applicationsCount?: number;
}

export interface JobApplication {
  _id: string;
  career: string | { _id: string; title: string; department?: string; location?: string };
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  portfolioUrl?: string;
  resumeUrl: string;
  coverLetter?: string;
  status: 'Received' | 'Under Review' | 'Shortlisted' | 'Accepted' | 'Hired' | 'Rejected';
  createdAt: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'New' | 'Read' | 'Replied';
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  maxUses: number;
  expiresAt: string;
  isActive: boolean;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreVisitItem {
  product?: string | { _id: string; name: string; images?: string[]; price: number };
  name: string;
  sku?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface StoreVisitInvoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  storeLocation: string;
  items: StoreVisitItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'netbanking';
  paymentStatus: 'paid' | 'pending';
  notes?: string;
  servedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
