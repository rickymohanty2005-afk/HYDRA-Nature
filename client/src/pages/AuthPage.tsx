import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Phone, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, registerUser, clearError } from '../store/authSlice';
import { authService } from '../services/authService';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const { isAuthenticated, user, loading, error } = useAppSelector((state) => state.auth);
  const redirectPath = searchParams.get('redirect') || '/';

  // Toggle between 'login' and 'register' and 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [mode, dispatch]);

  // Redirect after login
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, user, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      const result = await dispatch(loginUser({ email, password }));
      if (loginUser.fulfilled.match(result)) {
        if (result.payload.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(redirectPath);
        }
      }
    } else if (mode === 'register') {
      const result = await dispatch(
        registerUser({
          name,
          email,
          password,
          phone: phone || undefined,
        })
      );
      if (registerUser.fulfilled.match(result)) {
        navigate(redirectPath);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg('');

    try {
      const res = await authService.forgotPassword(forgotEmail);
      setForgotMsg(res.message || 'Password reset link sent to your email.');
    } catch (err: any) {
      setForgotMsg(err.message || 'Error sending reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@hydra.com');
    setPassword('Admin@Hydra2026');
    setMode('login');
  };

  const fillDemoCustomer = () => {
    setEmail('customer@hydra.com');
    setPassword('Customer@123');
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
         <Link to="/" className="flex flex-shrink-0 items-center" aria-label="Hydra home">
                    <img loading="lazy" decoding="async"
                      src="/images/home/Logo.png"
                      alt="Hydra Professional Beauty"
                      className="h-auto w-24 object-contain [filter:brightness(0)_saturate(100%)_invert(17%)_sepia(20%)_saturate(1200%)_hue-rotate(102deg)_brightness(85%)_contrast(95%)] sm:w-28 lg:w-32"
                    />
                  </Link>
      </div>

      {/* Split-Screen Luxury Authentication Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white rounded-3xl shadow-2xl border border-[#EDE8E1] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Decorative Botanical Editorial Panel (Slides/Transforms) */}
          <div className="lg:col-span-5 bg-[#13382B] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Background Image Watermark */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img loading="lazy" decoding="async"
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
                alt="Botanical Background"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="relative z-10 space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C5A880]">
                Hydra Sanctum
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium leading-snug">
                {mode === 'login'
                  ? 'Welcome Back to Radiant Beauty'
                  : mode === 'register'
                  ? 'Begin Your Botanical Journey'
                  : 'Account Recovery'}
              </h2>
              <p className="text-xs text-[#CCDED2] leading-relaxed">
                Experience cold-pressed botanicals harmonized with proven cellular science. Access
                exclusive formulations, order tracking, and customized skincare consultations.
              </p>
            </div>

     

            {/* Switch Mode Button */}
            <div className="relative z-10 pt-6">
              {mode === 'login' ? (
                <div className="text-xs text-[#CCDED2]">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-white font-bold underline hover:text-[#C5A880]"
                  >
                    Create Account
                  </button>
                </div>
              ) : (
                <div className="text-xs text-[#CCDED2]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-white font-bold underline hover:text-[#C5A880]"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Interactive Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
            {mode === 'forgot' ? (
              /* Forgot Password Form */
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#13382B]">Reset Password</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your email to receive password reset instructions.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  {forgotMsg && (
                    <div className="p-3 bg-[#EAF1EB] text-[#2E6B48] rounded-xl text-xs font-medium">
                      {forgotMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-[#13382B] text-white rounded-full text-xs font-bold hover:bg-[#1E4D3B] transition-colors disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs font-semibold text-[#13382B] hover:underline"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Login / Register Form */
              <div className="space-y-6">
                {/* Form Tabs */}
                <div className="flex border-b border-[#EDE8E1]">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 mr-6 ${
                      mode === 'login'
                        ? 'border-[#13382B] text-[#13382B]'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 ${
                      mode === 'register'
                        ? 'border-[#13382B] text-[#13382B]'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sneha Patel"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                        />
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                        />
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">Password *</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[11px] text-[#2E6B48] hover:underline font-medium"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#13382B] text-white rounded-full text-xs font-bold tracking-wider hover:bg-[#1E4D3B] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#13382B]/20 disabled:opacity-50"
                  >
                    <span>
                      {loading
                        ? 'AUTHENTICATING...'
                        : mode === 'login'
                        ? 'SIGN IN'
                        : 'REGISTER NOW'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
