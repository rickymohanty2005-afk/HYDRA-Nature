import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  removeFromCart,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
} from '../store/cartSlice';
import { couponService } from '../services/couponService';

export const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, subtotal, shippingFee, discount, couponCode, tax, total } = useAppSelector(
    (state) => state.cart
  );

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await couponService.validate(couponInput.trim(), subtotal);
      dispatch(
        applyCoupon({
          code: res.data.code,
          discount: res.data.discountCalculated,
        })
      );
      setCouponSuccess(`Coupon ${res.data.code} applied! Saved ₹${res.data.discountCalculated}`);
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.response?.data?.message || err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-[#EAF1EB] text-[#13382B] flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#13382B]">Your Bag is Empty</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          Explore our dermatologist-formulated botanical elixirs, soothing moisturizers, and sheer
          sunscreens.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] transition-colors shadow-md"
        >
          <span>Discover Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF8F5] pb-24">
      {/* Header */}
      <div className="border-b border-[#EDE8E1] bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/shop" className="text-xs text-gray-500 hover:text-[#13382B] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#13382B]">
            Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
          </h1>
          <button
            onClick={() => dispatch(clearCart())}
            className="text-xs text-red-600 hover:underline"
          >
            Clear Bag
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Alert Banner */}
            <div className="p-4 bg-[#EAF1EB] rounded-2xl border border-[#CCDED2] flex items-center gap-2">
              <span className="text-base">🎉</span>
              <p className="text-xs text-[#2E6B48] font-bold">
                Complimentary Express Courier Shipping & Zero GST included on all orders across India!
              </p>
            </div>

            {/* Items Table/Cards */}
            <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-contain rounded-2xl bg-[#FAF8F5] p-2 flex-shrink-0 border border-[#EDE8E1]"
                    />
                    <div>
                      <Link
                        to={`/shop/${item.productId}`}
                        className="font-serif text-sm sm:text-base font-bold text-[#1A211D] hover:text-[#13382B]"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">Size: {item.size || '50ml'}</p>
                      <p className="text-xs font-semibold text-[#13382B] mt-1 sm:hidden">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:gap-8">
                    {/* Quantity modifier */}
                    <div className="flex items-center border border-[#EDE8E1] rounded-xl bg-[#FAF8F5]">
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              quantity: item.quantity - 1,
                              size: item.size,
                            })
                          )
                        }
                        className="p-1.5 text-gray-600 hover:text-black"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              quantity: item.quantity + 1,
                              size: item.size,
                            })
                          )
                        }
                        className="p-1.5 text-gray-600 hover:text-black"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-serif text-sm font-bold text-[#13382B]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                      <button
                        onClick={() =>
                          dispatch(
                            removeFromCart({ productId: item.productId, size: item.size })
                          )
                        }
                        className="text-[11px] text-gray-400 hover:text-red-600 flex items-center gap-1 mt-1 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Summary Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#13382B] border-b border-gray-100 pb-3">
                Order Summary
              </h3>

              {/* Coupon Applicator */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Have a promotional voucher?
                </label>
                {couponCode ? (
                  <div className="flex items-center justify-between p-2.5 bg-[#EAF1EB] rounded-xl text-xs text-[#2E6B48]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      {couponCode} (-₹{discount})
                    </span>
                    <button
                      onClick={() => dispatch(removeCoupon())}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. HYDRA10, GLOW20"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] uppercase"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="px-4 py-2 bg-[#13382B] text-white text-xs font-semibold rounded-xl hover:bg-[#1E4D3B] disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-emerald-600 mt-1">{couponSuccess}</p>}
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Voucher Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Shipping Fee</span>
                  <span className="text-emerald-700 font-bold bg-[#EAF1EB] px-2 py-0.5 rounded-full text-[11px]">
                    FREE (All Orders)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>GST (Inclusive)</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">
                    Included in Price (₹0)
                  </span>
                </div>

                <div className="flex justify-between text-base font-serif font-bold text-[#13382B] pt-3 border-t border-[#EDE8E1]">
                  <span>Total Due</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-[#13382B] text-white rounded-full text-xs font-bold tracking-wider hover:bg-[#1E4D3B] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#13382B]/20"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3 bg-[#FAF8F5] rounded-xl text-[11px] text-gray-500 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E6B48]" />
                <span>Encrypted 256-Bit SSL Checkout Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
