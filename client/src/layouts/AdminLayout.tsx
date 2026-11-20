import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  Briefcase,
  Mail,
  Tag,
  AtSign,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Receipt,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../store';
import { logoutUser } from '../store/authSlice';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Protected route check
  if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#EDE8E1]">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#13382B]">Admin Access Required</h2>
          <p className="text-xs text-gray-600 mt-2">
            You must be signed in with an administrative account to access the Hydra Management Portal.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/auth"
              className="py-2.5 bg-[#13382B] text-white rounded-xl text-xs font-semibold hover:bg-[#1E4D3B] transition-colors"
            >
              Sign In as Administrator
            </Link>
            <Link
              to="/"
              className="py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth');
  };

  const navItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Product Reviews', path: '/admin/reviews', icon: MessageSquare },
    { name: 'Careers & Hiring', path: '/admin/careers', icon: Briefcase },
    { name: 'Coupons & Promos', path: '/admin/coupons', icon: Tag },
     { name: 'Store Visit Invoices', path: '/admin/visit-invoices', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#13382B] text-white flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-[#22503E] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#C5A880]">Hydra Management</h2>
              <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold mt-1 block">
                Control Center
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#C5A880] text-[#13382B] font-bold shadow-md'
                      : 'text-[#CCDED2] hover:bg-[#1E4D3B] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Back to Store */}
        <div className="p-4 border-t border-[#22503E] space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-[#A2B997] hover:bg-[#1E4D3B] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-[#22503E]/50 px-2">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-[#A2B997] truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-[#1E4D3B] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#EDE8E1] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-gray-600 hover:text-black rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-lg font-bold text-[#13382B]">
              Hydra Executive Management
            </h1>
          </div>

          <div className="flex items-center gap-4">
           
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-[#C5A880] shadow-sm flex items-center justify-center">
              <img loading="lazy" decoding="async"
                src="/images/home/Logo.png"
                alt="Hydra logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
