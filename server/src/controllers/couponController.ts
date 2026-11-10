import { Request, Response, NextFunction } from 'express';
import { Coupon } from '../models/Coupon';
import { ApiError } from '../utils/apiError';

// Validate coupon code against subtotal
export const validateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return next(new ApiError('Coupon code is required', 400));
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon) {
      return next(new ApiError('Invalid or expired coupon code', 400));
    }

    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
      return next(new ApiError('This coupon has reached its maximum usage limit', 400));
    }

    const cartSubtotal = Number(subtotal || 0);
    if (cartSubtotal < coupon.minOrderValue) {
      return next(
        new ApiError(
          `This coupon requires a minimum cart value of ₹${coupon.minOrderValue}`,
          400
        )
      );
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountCalculated: Math.round(discount),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      minOrderAmount,
      maxDiscount,
      maxUses,
      expiresAt,
      isActive,
    } = req.body;

    if (!code || !code.trim()) {
      return next(new ApiError('Coupon code is required', 400));
    }

    if (discountValue === undefined || discountValue === null || Number(discountValue) <= 0) {
      return next(new ApiError('Discount value is required and must be greater than 0', 400));
    }

    // maxUses is mandatory
    if (
      maxUses === undefined ||
      maxUses === null ||
      maxUses === '' ||
      isNaN(Number(maxUses)) ||
      Number(maxUses) < 1
    ) {
      return next(new ApiError('Max uses is a mandatory field and must be at least 1', 400));
    }

    if (!expiresAt) {
      return next(new ApiError('Expiry date is required', 400));
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return next(new ApiError('A coupon with this code already exists', 400));
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue ?? minOrderAmount ?? 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      maxUses: Number(maxUses),
      expiresAt: new Date(expiresAt),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      usageCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      minOrderAmount,
      maxDiscount,
      maxUses,
      expiresAt,
      isActive,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return next(new ApiError('Coupon not found', 404));
    }

    if (code && code.toUpperCase().trim() !== coupon.code) {
      const existing = await Coupon.findOne({
        code: code.toUpperCase().trim(),
        _id: { $ne: id },
      });
      if (existing) {
        return next(new ApiError('A coupon with this code already exists', 400));
      }
      coupon.code = code.toUpperCase().trim();
    }

    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minOrderValue !== undefined || minOrderAmount !== undefined) {
      coupon.minOrderValue = Number(minOrderValue ?? minOrderAmount ?? 0);
    }
    if (maxDiscount !== undefined) {
      coupon.maxDiscount = maxDiscount ? Number(maxDiscount) : undefined;
    }
    if (maxUses !== undefined) {
      if (isNaN(Number(maxUses)) || Number(maxUses) < 1) {
        return next(new ApiError('Max uses must be at least 1', 400));
      }
      coupon.maxUses = Number(maxUses);
    }
    if (expiresAt !== undefined) coupon.expiresAt = new Date(expiresAt);
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return next(new ApiError('Coupon not found', 404));
    }

    await coupon.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
