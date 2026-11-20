import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Plus,
  FileText,
  Printer,
  Download,
  MapPin,
  ExternalLink,
  Banknote,
  Coins,
  Tag,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCart, applyCoupon, removeCoupon } from '../store/cartSlice';
import { checkAuth } from '../store/authSlice';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { couponService } from '../services/couponService';
import { downloadOrderInvoicePdf } from '../utils/invoiceGenerator';
import { Address, Order } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { items, subtotal, shippingFee, discount, couponCode, tax, total } = useAppSelector(
    (state) => state.cart
  );

  // Address Form State
  const defaultAddress = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress?._id || (user?.addresses?.length ? '0' : 'new')
  );
  const [isEnteringNewAddress, setIsEnteringNewAddress] = useState<boolean>(
    !user?.addresses || user.addresses.length === 0
  );

  const [address, setAddress] = useState<Address>({
    fullName: defaultAddress?.fullName || user?.name || '',
    street: defaultAddress?.street || '',
    apartment: defaultAddress?.apartment || '',
    city: defaultAddress?.city || '',
    state: defaultAddress?.state || '',
    postalCode: defaultAddress?.postalCode || '',
    country: 'India',
    phone: defaultAddress?.phone || user?.phone || '',
    label: 'Home',
  });

  const [saveToProfile, setSaveToProfile] = useState(true);
  const [setAsPrimaryOnSave, setSetAsPrimaryOnSave] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Coupon State in Order Review Card
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Fetch active store coupons for quick-apply suggestions
  React.useEffect(() => {
    let isMounted = true;
    const loadCoupons = async () => {
      try {
        const list = await couponService.getAll();
        const couponsArray = Array.isArray(list) ? list : list?.coupons || [];
        if (isMounted && Array.isArray(couponsArray)) {
          const valid = couponsArray.filter(
            (c: any) => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date())
          );
          setAvailableCoupons(valid.slice(0, 3));
        }
      } catch {
        // Graceful fallback if public coupon endpoint requires admin or fails
      }
    };
    loadCoupons();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyCoupon = async (
    e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent,
    overrideCode?: string
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const code = (overrideCode || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a promotional voucher code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await couponService.validate(code, subtotal);
      const couponData = res?.data || res;
      const validatedCode = (couponData?.code || res?.code || code).toUpperCase();
      const calculatedDiscount = Math.round(
        Number(couponData?.discountCalculated ?? res?.discountCalculated ?? couponData?.discount ?? 0)
      );

      if (calculatedDiscount <= 0) {
        setCouponError(`Voucher '${validatedCode}' does not apply any discount to this cart.`);
        return;
      }

      dispatch(
        applyCoupon({
          code: validatedCode,
          discount: calculatedDiscount,
        })
      );
      setCouponSuccess(`Voucher '${validatedCode}' applied! Total payable reduced by ₹${calculatedDiscount.toLocaleString('en-IN')}`);
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.response?.data?.message || err.message || 'Invalid or expired promotional code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dispatch(removeCoupon());
    setCouponSuccess('');
    setCouponError('');
    setCouponInput('');
  };

  // COD Validation Rule: 2 or more distinct products OR any product with quantity >= 2
  const isCodEligible = items.length >= 2 || items.some((item) => item.quantity >= 2);

  // When user switches saved address
  const handleSelectSavedAddress = (savedAddr: Address, idx: number) => {
    setSelectedAddressId(savedAddr._id || String(idx));
    setIsEnteringNewAddress(false);
    setAddress({
      fullName: savedAddr.fullName,
      street: savedAddr.street,
      apartment: savedAddr.apartment || '',
      city: savedAddr.city,
      state: savedAddr.state,
      postalCode: savedAddr.postalCode,
      country: savedAddr.country || 'India',
      phone: savedAddr.phone,
      label: savedAddr.label || 'Home',
    });
  };

  const handleSwitchToNewAddress = () => {
    setSelectedAddressId('new');
    setIsEnteringNewAddress(true);
    setAddress({
      fullName: user?.name || '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phone: user?.phone || '',
      label: 'Home',
    });
  };

  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <h2 className="font-serif text-2xl font-bold text-[#13382B]">No items to checkout</h2>
        <Link
          to="/shop"
          className="mt-4 inline-block px-6 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  // Execute payment flow
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check auth
    if (!isAuthenticated) {
      navigate('/auth?redirect=/checkout');
      return;
    }

    if (!address.fullName || !address.street || !address.city || !address.state || !address.postalCode || !address.phone) {
      setErrorMessage('Please fill in all required shipping address fields.');
      return;
    }

    setPaymentLoading(true);
    setErrorMessage('');

    // If entering a new address and user checked save to profile
    if (isEnteringNewAddress && saveToProfile && user) {
      try {
        if ((user.addresses?.length || 0) < 4) {
          await authService.addAddress({
            ...address,
            isDefault: setAsPrimaryOnSave || (user.addresses?.length || 0) === 0,
          });
          await dispatch(checkAuth());
        }
      } catch (saveErr) {
        console.warn('Address auto-save notice:', saveErr);
      }
    }

    // If user chose Cash on Delivery (Cash on Pay)
    if (paymentMethod === 'cod') {
      if (!isCodEligible) {
        setErrorMessage(
          'Cash on Delivery is only available when selecting at least 2 products or any product with quantity 2 or more.'
        );
        setPaymentLoading(false);
        return;
      }

      try {
        const codRes = await orderService.createCODOrder({
          items,
          shippingAddress: address,
          couponCode: couponCode || undefined,
        });

        dispatch(clearCart());
        setConfirmedOrder(codRes.data);
      } catch (codErr: any) {
        setErrorMessage(codErr.response?.data?.message || codErr.message || 'Failed to place COD order');
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    try {
      // 1. Create Order on Server (generates Order in DB + Razorpay gateway order)
      const orderInitRes = await orderService.createRazorpayOrder(items, couponCode || undefined, address);
      const { order: createdOrder, razorpayOrder, keyId } = orderInitRes.data;
      const rzpOrder = razorpayOrder || orderInitRes.data.order;

      // 2. Open Razorpay Checkout modal if Razorpay is loaded and key is valid
      if (window.Razorpay && !rzpOrder.isMock) {
        const options = {
          key: keyId,
          amount: rzpOrder.amount,
          currency: 'INR',
          name: 'Hydra Skincare',
          description: 'Luxury Botanical Skincare Order',
          image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=120&q=80',
          order_id: rzpOrder.id,
          handler: async function (response: any) {
            try {
              // 3. Verify Payment on Server and confirm Order
              const verifyRes = await orderService.verifyOrderPayment(createdOrder._id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              dispatch(clearCart());
              setConfirmedOrder(verifyRes.data);
            } catch (vErr: any) {
              setErrorMessage(vErr.message || 'Payment verification failed.');
              setPaymentLoading(false);
            }
          },
          prefill: {
            name: address.fullName,
            email: user?.email,
            contact: address.phone,
          },
          theme: {
            color: '#13382B',
          },
          modal: {
            ondismiss: function () {
              setPaymentLoading(false);
              // Order is saved in DB in placed status — can complete from Orders page
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async function (failRes: any) {
          try {
            await orderService.recordPaymentFailure(createdOrder._id, failRes?.error?.description);
          } catch {}
          setErrorMessage(failRes.error?.description || 'Payment was unsuccessful. You can retry anytime from Order History.');
          setPaymentLoading(false);
        });
        rzp.open();
      } else {
        // Safe Development / Sandbox Instant Verification Simulation
        const verifyRes = await orderService.verifyOrderPayment(createdOrder._id, {
          razorpay_order_id: rzpOrder.id,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'mock_verified_signature',
        });

        dispatch(clearCart());
        setConfirmedOrder(verifyRes.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate order. Please try again.');
      setPaymentLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] pb-24">
      {/* Checkout Header */}
      <div className="bg-white border-b border-[#EDE8E1] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold text-[#13382B]">
            Hydra Skincare
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[#2E6B48] font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure 256-Bit SSL Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Already have a Hydra account? Sign in for saved addresses and loyalty perks.</span>
            </div>
            <Link
              to="/auth?redirect=/checkout"
              className="text-xs font-bold text-[#13382B] hover:underline"
            >
              Sign In →
            </Link>
          </div>
        )}

        <form onSubmit={handlePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Shipping Address & Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-sm space-y-5">
              <h2 className="font-serif text-xl font-bold text-[#13382B] border-b border-gray-100 pb-3">
                1. Shipping Address
              </h2>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="font-serif text-xl font-bold text-[#13382B]">
                  1. Delivery Address
                </h2>
                {user?.addresses && user.addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isEnteringNewAddress) {
                        const def = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
                        if (def) handleSelectSavedAddress(def, 0);
                      } else {
                        handleSwitchToNewAddress();
                      }
                    }}
                    className="text-xs font-semibold text-[#13382B] hover:underline flex items-center gap-1"
                  >
                    {isEnteringNewAddress ? '← Use Saved Address' : '+ Add New Address'}
                  </button>
                )}
              </div>

              {/* Saved Address Selector */}
              {!isEnteringNewAddress && user?.addresses && user.addresses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      Select delivery destination ({user.addresses.length} saved):
                    </span>
                    <Link
                      to="/profile"
                      className="text-[11px] text-[#2E6B48] font-bold hover:underline"
                    >
                      Manage Address Book →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.addresses.map((a, i) => {
                      const isSelected =
                        selectedAddressId === (a._id || String(i)) ||
                        (address.street === a.street && address.postalCode === a.postalCode);

                      return (
                        <div
                          key={a._id || i}
                          onClick={() => handleSelectSavedAddress(a, i)}
                          className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all relative ${
                            isSelected
                              ? 'border-[#13382B] bg-[#F7FAF8] shadow-sm ring-2 ring-[#13382B]/20'
                              : 'border-[#EDE8E1] bg-[#FAF8F5] hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-0.5 rounded border border-[#EDE8E1]">
                              {a.label || 'Saved'}
                            </span>
                            {a.isDefault && (
                              <span className="text-[10px] font-bold text-[#2E6B48] bg-[#EAF1EB] px-2 py-0.5 rounded-full">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-gray-900 text-sm">{a.fullName}</p>
                          <p className="text-gray-600 mt-0.5 line-clamp-1">{a.street}</p>
                          <p className="text-gray-600">
                            {a.city}, {a.state} - {a.postalCode}
                          </p>
                          <p className="text-gray-500 text-[11px] mt-1 font-medium">
                            Ph: {a.phone}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Address Input Form */}
              {(isEnteringNewAddress || !user?.addresses || user.addresses.length === 0) && (
                <div className="space-y-4 pt-1">
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] text-xs text-gray-600">
                    Entering a new delivery address for this order.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Recipient's Name"
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="House / Flat / Building No. & Street"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Apartment / Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Suite, unit, floor, landmark"
                        value={address.apartment || ''}
                        onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bhubaneswar"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Odisha"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Postal PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 751024"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Contact Phone Number (For Courier Updates) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                    </div>
                  </div>

                  {/* Save to Profile Options */}
                  {isAuthenticated && (
                    <div className="pt-2 space-y-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="saveToProf"
                          checked={saveToProfile}
                          onChange={(e) => setSaveToProfile(e.target.checked)}
                          className="w-4 h-4 rounded text-[#13382B] focus:ring-[#13382B]"
                        />
                        <label htmlFor="saveToProf" className="text-xs text-gray-700 cursor-pointer">
                          Save this address to my profile (1 Primary + 3 Extra addresses)
                        </label>
                      </div>

                      {saveToProfile && (
                        <div className="flex items-center gap-2 pl-6">
                          <input
                            type="checkbox"
                            id="setAsPrim"
                            checked={setAsPrimaryOnSave}
                            onChange={(e) => setSetAsPrimaryOnSave(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-[#13382B] focus:ring-[#13382B]"
                          />
                          <label htmlFor="setAsPrim" className="text-[11px] font-semibold text-gray-600 cursor-pointer">
                            Set as Primary Address for future orders
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-sm space-y-4">
              <h2 className="font-serif text-xl font-bold text-[#13382B] border-b border-gray-100 pb-3">
                2. Payment Method
              </h2>

              <div className="space-y-3">
                {/* Method 1: Razorpay */}
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#13382B] bg-[#F7FAF8] shadow-sm ring-1 ring-[#13382B]/20'
                      : 'border-[#EDE8E1] bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        paymentMethod === 'razorpay'
                          ? 'bg-[#13382B] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#13382B]">Razorpay Official Gateway</p>
                      <p className="text-[11px] text-gray-500">
                        UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'razorpay'
                        ? 'border-[#13382B] bg-[#13382B]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {paymentMethod === 'razorpay' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* Method 2: Cash on Pay (Cash on Delivery) */}
                <div
                  onClick={() => {
                    if (isCodEligible) {
                      setPaymentMethod('cod');
                      setErrorMessage('');
                    } else {
                      setErrorMessage(
                        'Cash on Delivery is only available when selecting at least 2 products or any single product with quantity 2 or more.'
                      );
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-[#13382B] bg-[#F7FAF8] shadow-sm ring-1 ring-[#13382B]/20'
                      : isCodEligible
                      ? 'border-[#EDE8E1] bg-white hover:border-gray-300'
                      : 'border-gray-200 bg-gray-50/70 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          paymentMethod === 'cod'
                            ? 'bg-[#13382B] text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#13382B]">Cash on Delivery (Cash on Pay)</p>
                          {isCodEligible ? (
                            <span className="text-[10px] font-bold text-[#2E6B48] bg-[#EAF1EB] px-2 py-0.5 rounded-full">
                              ✓ Eligible
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Requires 2+ items or Qty ≥ 2
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Pay cash or UPI directly to delivery agent upon receiving order
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'cod'
                          ? 'border-[#13382B] bg-[#13382B]'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {paymentMethod === 'cod' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* COD Eligibility Info Banner */}
                  {!isCodEligible && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Validation Rule:</strong> Select at least <strong>2 products</strong> or order <strong>quantity 2 or more</strong> of any product to unlock Cash on Pay.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Instant Pay */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#13382B] border-b border-gray-100 pb-3">
                Order Review ({items.length} items)
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img loading="lazy" decoding="async"
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-contain bg-[#FAF8F5] rounded-lg p-1 border border-[#EDE8E1]"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-gray-500">
                          Qty: {item.quantity} • {item.size || '50ml'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#13382B]">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promotional Coupon Applicator Section in Order Review */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#2E6B48]" />
                    <span>Promotional Voucher / Coupon</span>
                  </label>
                  {couponCode && (
                    <span className="text-[10px] font-bold text-[#2E6B48] bg-[#EAF1EB] px-2 py-0.5 rounded-full border border-[#B8DAC2]">
                      Applied from Bag
                    </span>
                  )}
                </div>

                {couponCode ? (
                  <div className="flex items-center justify-between p-3 bg-[#EAF1EB] rounded-2xl text-xs text-[#2E6B48] border border-[#B8DAC2] shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#13382B] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                        %
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold tracking-wider text-sm text-[#13382B]">{couponCode}</span>
                          <span className="text-[10px] bg-white text-[#2E6B48] px-1.5 py-0.5 rounded font-bold border border-[#B8DAC2]">
                            APPLIED
                          </span>
                        </div>
                        <p className="text-[11px] text-[#2E6B48] font-semibold mt-0.5">
                          Total payable reduced by ₹{discount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline px-2 py-1 transition-colors"
                      title="Remove applied coupon"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. HYDRA10, GLOW20"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleApplyCoupon();
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] focus:ring-1 focus:ring-[#13382B] uppercase tracking-wider font-mono bg-[#FAF8F5] focus:bg-white transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleApplyCoupon();
                        }}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 bg-[#13382B] hover:bg-[#1E4D3B] text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                      >
                        {couponLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Validating...</span>
                          </>
                        ) : (
                          <span>Apply</span>
                        )}
                      </button>
                    </div>

                    {/* Quick clickable voucher chips if available */}
                    {availableCoupons.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-gray-500 font-medium">Available:</span>
                        {availableCoupons.map((c) => (
                          <button
                            key={c._id || c.code}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCouponInput(c.code);
                              handleApplyCoupon(undefined, c.code);
                            }}
                            className="px-2 py-0.5 bg-[#FAF8F5] hover:bg-[#EAF1EB] text-[#13382B] hover:text-[#2E6B48] rounded-full text-[10px] font-mono font-bold border border-[#EDE8E1] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>🏷️</span>
                            <span>{c.code}</span>
                            <span className="text-[9px] text-gray-500 font-sans">
                              ({c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`} OFF)
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400">
                      Enter your promotional coupon or gift voucher to claim exclusive discounts.
                    </p>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-600 font-medium flex items-center gap-1.5 mt-1 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    <span>⚠️</span>
                    <span>{couponError}</span>
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 mt-1 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <span>✅</span>
                    <span>{couponSuccess}</span>
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-gray-600 pt-3 border-t border-gray-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/70 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Voucher Discount ({couponCode})</span>
                    </span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Shipping Charge</span>
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

                <div className="flex justify-between items-baseline text-base font-serif font-bold text-[#13382B] pt-3 border-t border-[#EDE8E1]">
                  <div>
                    <span>Total Payable</span>
                    {discount > 0 && (
                      <span className="block text-[11px] font-sans font-semibold text-[#2E6B48]">
                        🎉 ₹{discount.toLocaleString('en-IN')} Discount Applied
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg">₹{total.toLocaleString('en-IN')}</span>
                    {discount > 0 && (
                      <span className="block text-[11px] font-sans text-gray-400 line-through font-normal">
                        MRP: ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={paymentLoading || (paymentMethod === 'cod' && !isCodEligible)}
                className={`w-full py-4 text-white rounded-full text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                  paymentMethod === 'cod'
                    ? 'bg-[#2E6B48] hover:bg-[#235338] shadow-[#2E6B48]/20'
                    : 'bg-[#13382B] hover:bg-[#1E4D3B] shadow-[#13382B]/20'
                }`}
              >
                <span>
                  {paymentLoading
                    ? paymentMethod === 'cod'
                      ? 'PLACING CASH ON DELIVERY ORDER...'
                      : 'PROCESSING SECURE PAYMENT...'
                    : paymentMethod === 'cod'
                    ? `CONFIRM CASH ON DELIVERY — ₹${total.toLocaleString('en-IN')}`
                    : `PAY ₹${total.toLocaleString('en-IN')} VIA RAZORPAY`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero shipping fee on all purchases • 100% Genuine botanical formulations.</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ─── Order Confirmation Modal Popup ─── */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-xl w-full border border-[#EDE8E1] shadow-2xl space-y-6 relative my-8">
            {/* Header Icon & Title */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#EAF1EB] text-[#2E6B48] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="text-[11px] uppercase tracking-widest text-[#2E6B48] font-bold">
                {confirmedOrder.paymentMethod === 'cod'
                  ? 'Cash on Delivery Order Confirmed'
                  : 'Payment Verified & Order Confirmed'}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#13382B]">
                {confirmedOrder.paymentMethod === 'cod'
                  ? 'Order Placed Successfully!'
                  : 'Thank you for your order!'}
              </h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                We've received your order{' '}
                <strong className="text-gray-900 font-mono">#{confirmedOrder.orderNumber}</strong>.
                {confirmedOrder.paymentMethod === 'cod'
                  ? ' Your formulations are being packed. Please keep the exact amount or UPI ready when our courier arrives.'
                  : ' Your pure botanical skincare formulations are being prepared for dispatch.'}
              </p>
            </div>

            {/* Order & Shipment Quick Summary */}
            <div className="bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 border border-[#EDE8E1] space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500">
                  {confirmedOrder.paymentMethod === 'cod' ? 'Amount Due on Delivery:' : 'Total Amount Paid:'}
                </span>
                <span className="font-serif text-base font-bold text-[#13382B]">
                  ₹{confirmedOrder.total.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-medium text-gray-800">
                  {confirmedOrder.paymentMethod === 'cod'
                    ? 'Cash on Delivery (Cash on Pay)'
                    : `Razorpay (${confirmedOrder.paymentDetails?.razorpayPaymentId || 'Verified Online'})`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Shiprocket Courier:</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#2E6B48]" />
                  <span>{confirmedOrder.shiprocket?.courierName || 'Priority Skincare Air Courier'}</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tracking AWB:</span>
                <span className="font-mono text-gray-900 font-bold">
                  {confirmedOrder.shiprocket?.awbCode || confirmedOrder.trackingNumber || 'Manifested'}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-200 text-gray-600">
                <span className="text-gray-400">Delivering to: </span>
                <strong>{confirmedOrder.shippingAddress.fullName}</strong>,{' '}
                {confirmedOrder.shippingAddress.street}, {confirmedOrder.shippingAddress.city} -{' '}
                {confirmedOrder.shippingAddress.postalCode}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
          
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${confirmedOrder._id}`)}
                  className="py-3 px-4 bg-[#FAF8F5] text-[#13382B] border border-[#EDE8E1] hover:bg-[#EAF1EB] rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-[#2E6B48]" />
                  <span>Track Order Live</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="py-3 px-4 bg-[#FAF8F5] text-gray-700 border border-[#EDE8E1] hover:bg-gray-100 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <span>Order History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
