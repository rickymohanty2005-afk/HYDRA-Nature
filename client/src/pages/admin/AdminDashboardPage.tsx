import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  Package,
  Calendar,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import { adminService, DashboardAnalytics } from '../../services/adminService';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const RECENT_ORDERS_LIMIT = 5;
  const REFRESH_INTERVAL_MS = 30000;

  const fetchAnalytics = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const res = await adminService.getAnalytics();
      setData(res);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    // Periodically refresh so recent orders stay up to date
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchAnalytics(true);
    }, REFRESH_INTERVAL_MS);

    // Refresh immediately when the admin returns to the tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchAnalytics(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchAnalytics]);

  const recentOrders = (data?.recentOrders ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_ORDERS_LIMIT);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200" />
          ))}
        </div>
        <div className="h-72 bg-white rounded-2xl border border-gray-200" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    pendingApplications: 0,
    newInquiries: 0,
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#13382B]">Executive Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time sales telemetry, order processing, and botanical catalog health.
          </p>
        </div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#13382B] text-white rounded-xl text-xs font-semibold hover:bg-[#1E4D3B] transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Manage Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDE8E1] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="font-serif text-2xl font-bold text-[#13382B] mt-1">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
              +18.4% from last month
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EAF1EB] text-[#13382B] flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDE8E1] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Total Orders
            </p>
            <h3 className="font-serif text-2xl font-bold text-[#13382B] mt-1">
              {stats.totalOrders}
            </h3>
            <Link to="/admin/orders" className="text-[11px] text-[#2E6B48] font-bold hover:underline mt-1 inline-block">
              View all orders →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EAF1EB] text-[#13382B] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDE8E1] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Customers
            </p>
            <h3 className="font-serif text-2xl font-bold text-[#13382B] mt-1">
              {stats.totalCustomers}
            </h3>
            <span className="text-[11px] text-gray-500 mt-1 inline-block">
              Registered users
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EAF1EB] text-[#13382B] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDE8E1] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Low Stock Alerts
            </p>
            <h3 className="font-serif text-2xl font-bold text-amber-700 mt-1">
              {stats.lowStockCount} Items
            </h3>
       
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Monthly Sales Revenue Chart Visual Presentation */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#13382B]">
              Monthly Revenue Performance
            </h3>
            <p className="text-xs text-gray-500">Gross completed sales volume in INR</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#2E6B48] font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>Consistent Growth</span>
          </div>
        </div>

        {/* Chart Bars */}
        <div className="grid grid-cols-6 gap-3 sm:gap-6 pt-6 items-end h-56 border-b border-gray-100 pb-4">
          {data?.monthlySales?.map((item, idx) => {
            const maxRev = Math.max(...(data.monthlySales.map((m) => m.revenue) || [100000]));
            const heightPercent = Math.max(15, Math.round((item.revenue / (maxRev || 1)) * 100));

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{(item.revenue / 1000).toFixed(0)}k
                </span>
                <div
                  className="w-full max-w-[48px] bg-gradient-to-t from-[#13382B] to-[#2E6B48] rounded-t-xl group-hover:from-[#C5A880] group-hover:to-[#D9BC93] transition-all duration-300 shadow-sm"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-xs font-semibold text-gray-700">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Recent Orders & Low Stock Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-serif text-base font-bold text-[#13382B]">Recent Orders</h3>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-[10px] text-gray-400">
                  Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
              <button
                type="button"
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#13382B] hover:text-[#2E6B48] disabled:opacity-50"
                title="Refresh recent orders"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">Order ID</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Total</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length > 0 ? (
                  recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-gray-50/60">
                      <td className="py-3 font-mono font-bold text-[#13382B]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 text-gray-800 font-medium">
                        {(ord.user as any)?.name || ord.shippingAddress.fullName}
                      </td>
                      <td className="py-3 font-serif font-bold text-gray-900">
                        ₹{ord.total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF1EB] text-[#2E6B48]">
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No recent orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Items List */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-serif text-base font-bold text-[#13382B]">Low Stock Watch</h3>
            
          </div>

          <div className="space-y-3">
            {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
              data.lowStockProducts.map((p) => (
                <div
                  key={p._id}
                  className="p-3 bg-[#FAF8F5] rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-500">{p.category}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[11px] flex-shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">
                All inventory levels optimal (&gt; 10 units).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
