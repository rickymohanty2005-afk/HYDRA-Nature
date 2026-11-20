import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
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
  skinType: string[];
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be non-negative'],
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Original price must be non-negative'],
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    tag: {
      type: String,
      default: '',
      trim: true,
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: [(val: string[]) => val.length > 0 && val.length <= 6, 'A product needs between 1 and 6 images'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 50,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    keyBenefits: {
      type: [String],
      default: [],
    },
    howToUse: {
      type: [String],
      default: [],
    },
    size: {
      type: String,
      default: '50ml',
    },
    skinType: {
      type: [String],
      default: ['All Skin Types'],
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto slug generation before validate & save
ProductSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  if (this.originalPrice > this.price) {
    this.discountPercentage = Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  } else {
    this.discountPercentage = 0;
  }
  next();
});

// Indexes for fast searching and filtering
ProductSchema.index({ name: 'text', description: 'text', subtitle: 'text' });
ProductSchema.index({ category: 1, subcategory: 1, price: 1, rating: -1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
