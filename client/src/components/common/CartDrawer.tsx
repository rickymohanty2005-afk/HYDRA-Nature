import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  removeFromCart,
  updateQuantity,
  toggleCartDrawer,
  applyCoupon,
  removeCoupon,
} from '../../store/cartSlice';
import { couponService } from '../../services/couponService';

export const CartDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, subtotal, shippingFee, discount, couponCode, tax, total, isCartOpen } =
    useAppSelector((state) => state.cart);

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  if (!isCartOpen) return null;

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
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    dispatch(toggleCartDrawer(false));
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => dispatch(toggleCartDrawer(false))}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#EDE8E1] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#13382B]" />
              <h2 className="font-serif text-xl font-bold text-[#13382B]">Your Bag</h2>
              <span className="text-xs bg-[#EAF1EB] text-[#2E6B48] font-semibold px-2.5 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="bg-[#EAF1EB] px-5 py-3 border-b border-[#DDE7DF]">
            {subtotal >= 999 ? (
              <p className="text-xs text-[#2E6B48] font-medium flex items-center gap-1.5">
                <span>🎉</span> You unlocked <strong>FREE Express Shipping</strong>!
              </p>
            ) : (
              <div>
                <p className="text-xs text-[#3F6352]">
                  Add <strong>₹{999 - subtotal}</strong> more for free delivery
                </p>
                <div className="w-full bg-[#CCDED2] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-[#2E6B48] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / 999) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#EAF1EB] flex items-center justify-center text-[#13382B] mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#1A211D]">
                  Your skincare bag is empty
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Discover botanical elixirs formulated with clean ingredients for radiant skin.
                </p>
                <button
                  onClick={() => {
                    dispatch(toggleCartDrawer(false));
                    navigate('/shop');
                  }}
                  className="mt-5 px-6 py-2.5 bg-[#13382B] text-white text-xs font-semibold rounded-full hover:bg-[#1E4D3B] transition-colors"
                >
                  Explore Skincare Collection
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex gap-4 p-3 bg-white rounded-xl border border-[#EDE8E1] shadow-sm"
                >
                  <img loading="lazy" decoding="async"
                    src={item.image}
                    alt={item.name}
                    className="w-18 h-20 object-contain rounded-lg bg-[#FAF8F5] p-1 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <Link
                          to={`/shop/${item.productId}`}
                          onClick={() => dispatch(toggleCartDrawer(false))}
                          className="font-serif text-sm font-semibold text-[#1A211D] hover:text-[#13382B] line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() =>
                            dispatch(removeFromCart({ productId: item.productId, size: item.size }))
                          }
                          className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500">{item.size || '50ml'}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#EDE8E1] rounded-lg bg-[#FAF8F5]">
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
                          className="p-1 text-gray-600 hover:text-black"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-medium text-gray-800">
                          {item.quantity}
                        </span>
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
                          className="p-1 text-gray-600 hover:text-black"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-serif text-sm font-bold text-[#13382B]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Calculations */}
          {items.length > 0 && (
            <div className="p-5 bg-white border-t border-[#EDE8E1] space-y-3">
              {/* Coupon Form */}
              {couponCode ? (
                <div className="flex items-center justify-between p-2.5 bg-[#EAF1EB] rounded-lg text-xs text-[#2E6B48]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon: <strong>{couponCode}</strong> (-₹{discount})</span>
                  </div>
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
                    placeholder="Enter coupon (e.g. HYDRA10, GLOW20)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-xs border border-[#EDE8E1] rounded-lg focus:outline-none focus:border-[#13382B] uppercase"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="px-4 py-2 bg-[#13382B] text-white text-xs font-medium rounded-lg hover:bg-[#1E4D3B] disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
              {couponSuccess && <p className="text-[11px] text-emerald-600">{couponSuccess}</p>}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span>{shippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shippingFee}`}</span>
                </div>
          
                <div className="flex justify-between text-sm font-serif font-bold text-[#13382B] pt-2 border-t border-[#EDE8E1]">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    dispatch(toggleCartDrawer(false));
                    navigate('/cart');
                  }}
                  className="w-full py-2.5 border border-[#13382B] text-[#13382B] rounded-full text-xs font-semibold hover:bg-[#FAF8F5] transition-colors"
                >
                  View Full Cart
                </button>
                <button
                  onClick={handleCheckout}
                  className="w-full py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
