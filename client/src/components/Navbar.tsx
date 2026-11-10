import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  LogOut,
  Package,
  LayoutDashboard,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../store';
import { logoutUser } from '../store/authSlice';
import { toggleCartDrawer } from '../store/cartSlice';

const navLinkClass = (isActive: boolean) =>
  `relative py-1 text-[13px] tracking-wide transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-[#1E9AA3] after:transition-all after:duration-300 ${
    isActive ? 'text-[#04282B] font-medium after:w-full' : 'text-[#04282B]/70 hover:text-[#04282B] after:w-0 hover:after:w-full'
  }`;

const iconButtonClass =
  'relative p-1.5 text-[#04282B] hover:text-[#1E9AA3] transition-colors rounded-full hover:bg-[#1E9AA3]/10';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.items);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setUserDropdownOpen(false);
    navigate('/');
  };

  // On the home page the navbar floats over the hero and stays clear until the user scrolls
  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled && !searchOpen && !mobileMenuOpen;

  return (
    <header className={`${isHome ? 'fixed inset-x-0' : 'sticky'} top-0 z-40 w-full transition-all duration-300`}>
      {/* Top Botanical Announcement Bar */}
      <div className="bg-[#04282B] text-[#FFFFFF] text-xs py-2 px-4 border-b border-[#04282B] transition-all">
        <div className="max-w-[1440px] mx-auto sm:px-4 lg:px-8 flex items-center justify-between">
          <div className="hidden sm:block text-[10px] tracking-[0.3em] text-[#7FDDE2]/80">
            NATURE • SCIENCE • RADIANCE
          </div>

          <div className="mx-auto sm:mx-0 flex items-center gap-2 text-center text-[11px] tracking-wider">
            <span className="text-[#7FDDE2]">Free Shipping.</span>

            <span className="text-[#FFFFFF]/85">Nature. Science. You.</span>
          </div>

          {/* Social Icons */}
          <div className="hidden md:flex items-center gap-3 text-[#7FDDE2]/80">
            <a href="https://www.instagram.com/hydra24n?xtok=ZDB5MHNxZm9pdmEz" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="https://youtube.com/@hydra24n?si=JfSpDw6Z4-sw432J" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="YouTube">
              <Youtube className="w-3.5 h-3.5" />
            </a>
            {/* <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors text-[10px] font-bold" aria-label="X">
              𝕏
            </a> */}
            <a href="https://share.google.com/EVvTaNy0JJHQrcBSc" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
              <Facebook className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className={`w-full text-[#04282B] transition-all duration-300 ${
          isTransparent
            ? 'bg-transparent border-b border-transparent py-4 lg:py-5'
            : isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_10px_30px_-12px_rgba(4,40,43,0.18)] border-b border-[#04282B]/[0.06] py-3'
            : 'bg-white border-b border-[#04282B]/[0.08] py-4 lg:py-5'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left: Mobile Hamburger + Desktop Navigation Links */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden -ml-2 p-2 text-[#04282B] hover:text-[#04282B] focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="hidden lg:flex items-center gap-7 xl:gap-9">
              <Link to="/" className={navLinkClass(location.pathname === '/')}>
                Home
              </Link>

              <Link to="/shop" className={navLinkClass(location.pathname.startsWith('/shop'))}>
                Shop
              </Link>

              <Link to="/about" className={navLinkClass(location.pathname === '/about')}>
                About
              </Link>

              <Link to="/blog" className={navLinkClass(location.pathname.startsWith('/blog'))}>
                Blog
              </Link>

              <Link to="/contact" className={navLinkClass(location.pathname === '/contact')}>
                Contact
              </Link>

              <Link to="/career" className={navLinkClass(location.pathname === '/career')}>
                Career
              </Link>
            </div>
          </div>

          {/* Center: Hydra Brand Wordmark & Emblem */}
          <Link to="/" className="flex flex-shrink-0 items-center justify-center" aria-label="Hydra home">
            <img
              src="/images/home/Logo.png"
              alt="Hydra Professional Beauty"
              className="h-auto w-24 object-contain [filter:brightness(0)_saturate(100%)_invert(17%)_sepia(20%)_saturate(1200%)_hue-rotate(102deg)_brightness(85%)_contrast(95%)] sm:w-28 lg:w-32"
            />
          </Link>

          {/* Right Action Icons: Search, Account, Wishlist, Cart */}
          <div className="flex items-center justify-end gap-1 sm:gap-3 lg:gap-4">
            {/* Search Toggle — styled as an underlined field on desktop */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="group flex items-center gap-3 p-1.5 md:px-0 md:pb-2 md:pt-1 md:border-b md:border-[#04282B]/20 md:hover:border-[#1E9AA3] md:w-40 xl:w-56 text-[#04282B] hover:text-[#04282B] transition-colors"
              aria-label="Search products"
            >
              <Search className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="hidden md:inline text-[13px] text-[#04282B]/55 group-hover:text-[#04282B] transition-colors">
                Search...
              </span>
            </button>

            {/* User Account / Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`${iconButtonClass} flex items-center gap-1`}
                aria-label="User Account"
              >
                <User className="w-5 h-5" />
                {user?.role === 'admin' && (
                  <span className="hidden sm:inline-block text-[10px] bg-[#04282B] text-[#FFFFFF] px-1.5 py-0.5 rounded font-bold uppercase">
                    Admin
                  </span>
                )}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-[#EDE8E1] py-2 z-50">
                  {isAuthenticated && user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#04282B] hover:bg-[#EAF1EB]"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-[#FAF8F5]"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <span>My Account</span>
                      </Link>

                      <Link
                        to="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-[#FAF8F5]"
                      >
                        <Package className="w-4 h-4 text-gray-500" />
                        <span>Order History</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-[#FAF8F5]"
                      >
                        <Heart className="w-4 h-4 text-gray-500" />
                        <span>Wishlist ({wishlistItems.length})</span>
                      </Link>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-xs text-gray-600 mb-2">Welcome to Hydra Skincare</p>
                      <Link
                        to="/auth"
                        className="block w-full py-2 bg-[#04282B] text-white text-xs font-semibold rounded-lg hover:bg-[#1E9AA3] transition-colors"
                      >
                        Sign In / Register
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            <Link to="/wishlist" className={iconButtonClass} aria-label="Wishlist">
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#04282B] text-[#FFFFFF] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Shopping Bag / Cart — "Bag (n)" style */}
            <button
              onClick={() => dispatch(toggleCartDrawer(true))}
              className="group flex items-center gap-2 pl-1.5 text-[#04282B] hover:text-[#04282B] transition-colors"
              aria-label="Open Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline text-[13px] tracking-wide">Bag</span>
              <span
                className={`flex h-7 min-w-[1.75rem] sm:h-8 sm:min-w-[2rem] items-center justify-center rounded-full border px-1.5 text-[11px] sm:text-xs font-medium transition-colors ${
                  totalCartCount > 0
                    ? 'border-[#04282B] bg-[#04282B] text-[#FFFFFF]'
                    : 'border-[#04282B]/30 group-hover:border-[#1E9AA3] group-hover:text-[#1E9AA3]'
                }`}
              >
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Animated Search Drawer */}
        {searchOpen && (
          <div className="mt-3 border-t border-[#04282B]/[0.08] bg-white px-4 py-4">
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex items-center gap-3 border-b border-[#04282B]/20 focus-within:border-[#1E9AA3] pb-2">
              <Search className="w-4 h-4 text-[#04282B]/80" />
              <input
                type="text"
                autoFocus
                placeholder="Search natural serums, moisturizers, cleansers, or sunscreen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent border-none focus:outline-none text-[#04282B] placeholder:text-[#04282B]/45"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#04282B] text-[#FFFFFF] text-xs font-semibold rounded-md hover:bg-[#1E9AA3]"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-[#04282B]/80 hover:text-[#04282B]"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 border-t border-[#04282B]/[0.08] bg-white px-4 pt-3 pb-6 space-y-1">
            <Link to="/" className="block py-2.5 font-serif text-lg text-[#04282B] hover:text-[#1E9AA3]">
              Home
            </Link>
            <Link to="/shop" className="block py-2.5 font-serif text-lg text-[#04282B] hover:text-[#1E9AA3]">
              Shop
            </Link>
            <Link to="/about" className="block py-2.5 font-serif text-lg text-[#04282B] hover:text-[#1E9AA3]">
              About Us
            </Link>
            <Link to="/blog" className="block py-2.5 font-serif text-lg text-[#04282B] hover:text-[#1E9AA3]">
              Blog
            </Link>
            <Link to="/contact" className="block py-2.5 font-serif text-lg text-[#04282B] hover:text-[#1E9AA3]">
              Contact
            </Link>
            <Link to="/career" className="block py-2.5 font-serif text-lg text-[#04282B] hover:text-[#1E9AA3]">
              Career
            </Link>
            {!isAuthenticated && (
              <div className="pt-3">
                <Link
                  to="/auth"
                  className="block w-full py-2.5 bg-[#04282B] text-[#FFFFFF] text-center text-xs font-semibold rounded-md hover:bg-[#1E9AA3] transition-colors"
                >
                  Sign In / Register
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};
