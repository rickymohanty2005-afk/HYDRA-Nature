import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StoreVisitInvoice, IStoreVisitItem } from '../models/StoreVisitInvoice';
import { Product } from '../models/Product';
import { ApiError } from '../utils/apiError';

/**
 * Generate a unique POS / Store Visit Invoice Number
 * Format: HYD-POS-YYYY-XXXX (e.g. HYD-POS-2026-1001)
 */
const generateInvoiceNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await StoreVisitInvoice.countDocuments();
  let candidate = `HYD-POS-${currentYear}-${(1001 + count).toString()}`;
  
  // If collision occurs, add random digits
  const exists = await StoreVisitInvoice.findOne({ invoiceNumber: candidate });
  if (exists) {
    candidate = `HYD-POS-${currentYear}-${Math.floor(10000 + Math.random() * 90000)}`;
  }
  return candidate;
};

/**
 * POST /api/admin/store-invoices
 * Create and persist a physical walk-in store customer purchase invoice
 */
export const createStoreVisitInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      storeLocation,
      items,
      discountAmount = 0,
      taxRate = 0,
      paymentMethod = 'cash',
      paymentStatus = 'paid',
      notes = '',
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return next(new ApiError('Customer name is required', 400));
    }

    if (!customerPhone || !customerPhone.trim()) {
      return next(new ApiError('Customer phone number is required', 400));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new ApiError('Please add at least one product item to the invoice', 400));
    }

    // Process & sanitize each line item
    const sanitizedItems: IStoreVisitItem[] = [];
    for (const rawItem of items) {
      const name = rawItem.name?.trim();
      const quantity = Math.max(1, Number(rawItem.quantity) || 1);
      const unitPrice = Math.max(0, Number(rawItem.unitPrice) || 0);

      if (!name) {
        return next(new ApiError('Each invoice item must have a product name', 400));
      }

      const total = Math.round(quantity * unitPrice * 100) / 100;

      sanitizedItems.push({
        product: rawItem.product || undefined,
        name,
        sku: rawItem.sku?.trim() || '',
        size: rawItem.size?.trim() || 'Standard',
        quantity,
        unitPrice,
        total,
      });

      // Optional: If product is linked to catalog, safely decrement inventory
      if (rawItem.product) {
        try {
          await Product.findByIdAndUpdate(rawItem.product, {
            $inc: { stock: -quantity },
          });
        } catch (stockErr) {
          console.warn('Could not update catalog stock for item:', rawItem.product, stockErr);
        }
      }
    }

    // Calculations
    const subtotal = Math.round(
      sanitizedItems.reduce((acc, it) => acc + it.total, 0) * 100
    ) / 100;

    const discount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxRate > 0
      ? Math.round(taxableAmount * (Number(taxRate) / 100) * 100) / 100
      : 0;

    const totalAmount = Math.max(0, Math.round((taxableAmount + tax) * 100) / 100);

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await StoreVisitInvoice.create({
      invoiceNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim() || '',
      customerAddress: customerAddress?.trim() || '',
      storeLocation: storeLocation?.trim() || 'Hydra Flagship Boutique',
      items: sanitizedItems,
      subtotal,
      discountAmount: discount,
      taxRate: Number(taxRate) || 0,
      taxAmount: tax,
      totalAmount,
      paymentMethod,
      paymentStatus,
      notes: notes?.trim() || '',
      servedBy: req.user?._id,
      servedByName: req.user?.name || 'Administrator',
    });

    res.status(201).json({
      success: true,
      message: 'Store visit invoice saved and generated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/store-invoices
 * Retrieve all physical walk-in store invoices with filters & KPI metrics
 */
export const getAllStoreVisitInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, paymentMethod, startDate, endDate } = req.query;

    const filter: any = {};

    if (search && typeof search === 'string') {
      const q = search.trim();
      filter.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: q, $options: 'i' } },
        { customerEmail: { $regex: q, $options: 'i' } },
        { invoiceNumber: { $regex: q, $options: 'i' } },
        { 'items.name': { $regex: q, $options: 'i' } },
      ];
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const invoices = await StoreVisitInvoice.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images price');

    // Calculate aggregated POS stats
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalItemsSold = invoices.reduce(
      (sum, inv) => sum + inv.items.reduce((iSum, it) => iSum + (it.quantity || 0), 0),
      0
    );

    const upiTotal = invoices
      .filter((i) => i.paymentMethod === 'upi')
      .reduce((s, i) => s + (i.totalAmount || 0), 0);

    const cashTotal = invoices
      .filter((i) => i.paymentMethod === 'cash')
      .reduce((s, i) => s + (i.totalAmount || 0), 0);

    const cardTotal = invoices
      .filter((i) => i.paymentMethod === 'card')
      .reduce((s, i) => s + (i.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      count: invoices.length,
      stats: {
        totalInvoices: invoices.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalItemsSold,
        upiTotal: Math.round(upiTotal * 100) / 100,
        cashTotal: Math.round(cashTotal * 100) / 100,
        cardTotal: Math.round(cardTotal * 100) / 100,
      },
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/store-invoices/:id
 * Retrieve a single store visit invoice by ID or invoiceNumber
 */
export const getStoreVisitInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    let invoice = await StoreVisitInvoice.findById(id).populate('items.product', 'name images price');
    if (!invoice) {
      invoice = await StoreVisitInvoice.findOne({ invoiceNumber: id.toUpperCase() }).populate(
        'items.product',
        'name images price'
      );
    }

    if (!invoice) {
      return next(new ApiError('Store visit invoice not found', 404));
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/store-invoices/:id
 * Remove a store visit invoice record
 */
export const deleteStoreVisitInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await StoreVisitInvoice.findByIdAndDelete(id);
    if (!invoice) {
      return next(new ApiError('Store visit invoice not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Store visit invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
