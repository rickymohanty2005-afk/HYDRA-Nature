import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Download,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingBag,
  RefreshCw,
  Building2,
  Sparkles,
  Printer,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { StoreVisitInvoice, StoreVisitItem, Product } from '../../types';
import { downloadStoreVisitInvoicePdf } from '../../utils/invoiceGenerator';
import { getImageUrl } from '../../utils/imageUrl';

interface LineItemInput {
  productId?: string;
  name: string;
  sku: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export const Adminvisitinvoice: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Catalog products for quick auto-fill
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Invoices list state
  const [invoices, setInvoices] = useState<StoreVisitInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [kpiStats, setKpiStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
    upiTotal: 0,
    cashTotal: 0,
    cardTotal: 0,
  });

  // Filter state for history tab
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [storeLocation, setStoreLocation] = useState('Hydra Flagship Store, Bangalore');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'netbanking'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0 = GST inclusive or 18%
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState<LineItemInput[]>([
    {
      productId: '',
      name: '',
      sku: '',
      size: 'Standard',
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch catalog products
  const fetchCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const res = await productService.getAll({ limit: 100 });
      setCatalogProducts(res.products || []);
    } catch (err) {
      console.error('Failed to load product catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Fetch store invoices history
  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const res = await adminService.getStoreInvoices({
        search: searchTerm || undefined,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined,
      });
      setInvoices(res.data || []);
      if (res.stats) {
        setKpiStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load store visit invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchInvoices();
    }
  }, [searchTerm, paymentFilter, activeTab]);

  // Line Item Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        name: '',
        sku: '',
        size: 'Standard',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Invoice must have at least one product item');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const selectedProd = catalogProducts.find((p) => p._id === productId);
    if (!selectedProd) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: selectedProd._id,
              name: selectedProd.name,
              sku: selectedProd.slug || selectedProd._id.slice(-6).toUpperCase(),
              size: selectedProd.size || 'Standard',
              unitPrice: selectedProd.price,
            }
          : item
      )
    );
  };

  const handleUpdateItem = (index: number, field: keyof LineItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Live Calculations
  const calculatedSubtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    0
  );

  const appliedDiscount = Math.min(calculatedSubtotal, Math.max(0, Number(discountAmount) || 0));
  const taxableAmount = Math.max(0, calculatedSubtotal - appliedDiscount);
  const calculatedTax = taxRate > 0 ? Math.round(taxableAmount * (taxRate / 100) * 100) / 100 : 0;
  const calculatedTotal = Math.max(0, Math.round((taxableAmount + calculatedTax) * 100) / 100);

  // Form Submit Handler
  const handleCreateAndDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    if (!customerName.trim()) {
      setActionErrorMessage('Customer full name is required');
      return;
    }

    if (!customerPhone.trim()) {
      setActionErrorMessage('Customer contact phone number is required');
      return;
    }

    const validItems = items.filter((it) => it.name.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      setActionErrorMessage('Please provide at least one valid product item');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        storeLocation: storeLocation.trim(),
        items: validItems.map((it) => ({
          product: it.productId || undefined,
          name: it.name.trim(),
          sku: it.sku.trim(),
          size: it.size.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })),
        discountAmount: appliedDiscount,
        taxRate: Number(taxRate) || 0,
        paymentMethod,
        paymentStatus,
        notes: notes.trim(),
      };

      const res = await adminService.createStoreInvoice(payload);

      if (res.success && res.data) {
        setActionSuccessMessage(
          `Invoice ${res.data.invoiceNumber} saved! Downloading PDF Tax Invoice...`
        );

        // Instant direct PDF download
        await downloadStoreVisitInvoicePdf(res.data);

        // Reset form for next customer
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerAddress('');
        setDiscountAmount(0);
        setNotes('');
        setItems([
          {
            productId: '',
            name: '',
            sku: '',
            size: 'Standard',
            quantity: 1,
            unitPrice: 0,
          },
        ]);

        // Refresh invoices list
        fetchInvoices();
      }
    } catch (err: any) {
      console.error(err);
      setActionErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save store invoice'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Instant PDF Download from History
  const handleDownloadInvoice = async (inv: StoreVisitInvoice) => {
    try {
      setDownloadingId(inv._id);
      await downloadStoreVisitInvoicePdf(inv);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Error generating PDF invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete Invoice Record
  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete invoice ${invoiceNumber}?`)) {
      return;
    }

    try {
      await adminService.deleteStoreInvoice(id);
      setInvoices((prev) => prev.filter((i) => i._id !== id));
      setActionSuccessMessage(`Invoice ${invoiceNumber} deleted successfully`);
      setTimeout(() => setActionSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#EAF1EB] text-[#2E6B48] rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#13382B]">
              Store Visit Invoices (POS)
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Input physical store walk-in purchases, persist customer records to database, and instantly download official Tax Invoices.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#EDE8E1] self-start sm:self-center">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-[#13382B] text-white shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Walk-in Invoice</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#13382B] text-white shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices Archive ({kpiStats.totalInvoices})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Walk-in Store Revenue</span>
            <span className="p-2 rounded-xl bg-[#FAF8F5] text-[#13382B]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-[#13382B] mt-2">
            ₹{kpiStats.totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Direct Boutique Purchases</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Walk-in Invoices</span>
            <span className="p-2 rounded-xl bg-[#FAF8F5] text-[#13382B]">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-[#13382B] mt-2">
            {kpiStats.totalInvoices}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Official Tax Receipts Generated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Units Handed to Customers</span>
            <span className="p-2 rounded-xl bg-[#FAF8F5] text-[#13382B]">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-[#13382B] mt-2">
            {kpiStats.totalItemsSold}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Products sold over the counter</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Payment Breakdown</span>
            <span className="p-2 rounded-xl bg-[#FAF8F5] text-[#13382B]">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>UPI / QR:</span>
              <span className="font-bold text-[#13382B]">₹{kpiStats.upiTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Cash:</span>
              <span className="font-bold text-[#13382B]">₹{kpiStats.cashTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccessMessage && (
        <div className="p-4 bg-[#EAF1EB] border border-[#B8DAC2] rounded-2xl text-xs font-medium text-[#2E6B48] flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-[#2E6B48] hover:underline font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-medium text-red-700 flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
          <button
            onClick={() => setActionErrorMessage(null)}
            className="text-red-700 hover:underline font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: CREATE NEW STORE VISIT INVOICE
      ────────────────────────────────────────────────────────────── */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateAndDownload} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Details (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Information Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
                <h2 className="font-serif text-base font-bold text-[#13382B] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2E6B48]" />
                  <span>Physical Store Visitor Details</span>
                </h2>
                <span className="text-[10px] text-emerald-700 bg-[#EAF1EB] px-2.5 py-0.5 rounded-full font-bold">
                  Walk-in Patron
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. patron@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Store Location / Counter
                  </label>
                  <input
                    type="text"
                    value={storeLocation}
                    onChange={(e) => setStoreLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer City / Address (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Indiranagar, Bangalore"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                  />
                </div>
              </div>
            </div>

            {/* Purchased Items Line Editor */}
            <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
                <div>
                  <h2 className="font-serif text-base font-bold text-[#13382B] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#2E6B48]" />
                    <span>Purchased Skincare Formulations</span>
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Select from catalog for instant auto-pricing or type custom bespoke item.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-[#EAF1EB] text-[#2E6B48] hover:bg-[#d8e8dc] transition-colors rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1] space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Catalog Select */}
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Product Name
                        </label>
                        {catalogProducts.length > 0 && (
                          <div className="mb-1.5">
                            <select
                              value={item.productId || ''}
                              onChange={(e) => handleSelectProduct(idx, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-[#EDE8E1] rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#13382B]"
                            >
                              <option value="">⚡ Quick Pick from Catalog...</option>
                              {catalogProducts.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} — ₹{p.price}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <input
                          type="text"
                          required
                          placeholder="Product Name"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                        />
                      </div>

                      {/* Size / Sizing */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Size
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 50ml"
                          value={item.size}
                          onChange={(e) => handleUpdateItem(idx, 'size', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Unit Price (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-full px-2 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-center focus:outline-none focus:border-[#13382B]"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="sm:col-span-2 text-right">
                        <span className="block text-[10px] text-gray-400 mb-1">Line Total</span>
                        <span className="text-sm font-bold text-[#13382B]">
                          ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Invoice Notes */}
            <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-4">
              <h2 className="font-serif text-base font-bold text-[#13382B] flex items-center gap-2 pb-3 border-b border-[#EDE8E1]">
                <CreditCard className="w-4 h-4 text-[#2E6B48]" />
                <span>Payment & Boutique Notes</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cash', label: '💵 Cash', bg: 'hover:bg-amber-50' },
                      { id: 'upi', label: '📲 UPI / QR', bg: 'hover:bg-indigo-50' },
                      { id: 'card', label: '💳 Card POS', bg: 'hover:bg-blue-50' },
                      { id: 'netbanking', label: '🏦 Net Bank', bg: 'hover:bg-cyan-50' },
                    ].map((pm) => (
                      <button
                        type="button"
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                          paymentMethod === pm.id
                            ? 'bg-[#13382B] text-white border-[#13382B] shadow-sm'
                            : `bg-[#FAF8F5] text-gray-700 border-[#EDE8E1] ${pm.bg}`
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('paid')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        paymentStatus === 'paid'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-[#FAF8F5] text-gray-700 border-[#EDE8E1]'
                      }`}
                    >
                      ✅ Paid in Full
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('pending')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        paymentStatus === 'pending'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-[#FAF8F5] text-gray-700 border-[#EDE8E1]'
                      }`}
                    >
                      ⏳ Pending Balance
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Staff Notes / Customer Consultation Memo (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Recommended Day Cream for dry skin profile. Complimentary sample included."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Bill Summary & Download Button (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-md sticky top-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
                <h3 className="font-serif text-base font-bold text-[#13382B]">
                  Walk-in Invoice Summary
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">LIVE PREVIEW</span>
              </div>

              {/* Customer quick glance */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] text-xs space-y-1">
                <p className="font-bold text-[#13382B]">
                  {customerName.trim() || 'Walk-in Patron'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {customerPhone.trim() || 'Phone not entered'}
                </p>
                <p className="text-[10px] text-gray-400">{storeLocation}</p>
              </div>

              {/* Items Breakdown list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600">
                    <span className="truncate max-w-[160px]">
                      {it.name || `Item #${i + 1}`} × {it.quantity}
                    </span>
                    <span className="font-medium text-[#13382B]">
                      ₹{((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Adjustments: Discount & GST */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Discount (₹)</span>
                    <span className="text-[10px] text-emerald-700">Optional voucher / off</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>GST / Tax</span>
                    <span className="text-[10px] text-gray-400">Select rate</span>
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
                  >
                    <option value={0}>0% — Price Inclusive of GST</option>
                    <option value={5}>5% GST (Cosmetic Essences)</option>
                    <option value={12}>12% GST (Botanical Formulations)</option>
                    <option value={18}>18% GST (Standard Luxury Cosmetics)</option>
                  </select>
                </div>
              </div>

              {/* Subtotal, Discount, GST, Total Lines */}
              <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{calculatedSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Store Discount</span>
                    <span>-₹{appliedDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {calculatedTax > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>GST ({taxRate}%)</span>
                    <span>+₹{calculatedTax.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-serif font-bold text-[#13382B] pt-2 border-t border-[#EDE8E1]">
                  <span>Total Payable</span>
                  <span className="text-xl text-[#13382B]">
                    ₹{calculatedTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Submit & Instant PDF Download Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#13382B] text-white rounded-2xl text-xs font-bold tracking-wider hover:bg-[#1E4D3B] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#13382B]/15 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>SAVING & GENERATING PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#C5A880]" />
                    <span>SAVE & DOWNLOAD INVOICE</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-gray-400">
                Official Tax Invoice will be stored in database and downloaded directly as PDF.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: INVOICES ARCHIVE / HISTORY
      ────────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-[#EDE8E1] p-6 shadow-sm space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer, phone, invoice #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#13382B]"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR</option>
                <option value="card">Card POS</option>
                <option value="netbanking">Net Banking</option>
              </select>

              <button
                onClick={fetchInvoices}
                disabled={loadingInvoices}
                className="p-2.5 border border-[#EDE8E1] bg-white rounded-xl hover:bg-[#FAF8F5] text-[#13382B] transition-colors"
                title="Refresh invoices list"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInvoices ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Invoices List / Table */}
          {loadingInvoices ? (
            <div className="p-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2E6B48]" />
              <span>Loading walk-in invoices archive...</span>
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDE8E1] text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Purchased Items</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE8E1]">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#13382B]">
                        {inv.invoiceNumber}
                        <span className="block text-[10px] text-gray-400 font-sans font-normal mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#13382B]">{inv.customerName}</p>
                        <p className="text-[11px] text-gray-500">{inv.customerPhone}</p>
                        {inv.customerEmail && (
                          <p className="text-[10px] text-gray-400">{inv.customerEmail}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-gray-800 truncate">
                          {inv.items.map((it) => `${it.name} (${it.quantity})`).join(', ')}
                        </p>
                        <span className="text-[10px] text-gray-400">
                          {inv.items.reduce((s, it) => s + it.quantity, 0)} total units
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.paymentMethod === 'upi'
                              ? 'bg-indigo-50 text-indigo-700'
                              : inv.paymentMethod === 'card'
                              ? 'bg-blue-50 text-blue-700'
                              : inv.paymentMethod === 'netbanking'
                              ? 'bg-cyan-50 text-cyan-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {inv.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-serif font-bold text-[#13382B] text-sm">
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadInvoice(inv)}
                            disabled={downloadingId === inv._id}
                            className="px-3.5 py-1.5 bg-[#13382B] text-white rounded-xl text-xs font-semibold hover:bg-[#1E4D3B] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                            title="Download PDF Tax Invoice"
                          >
                            {downloadingId === inv._id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 text-[#C5A880]" />
                                <span>Download PDF</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteInvoice(inv._id, inv.invoiceNumber)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete invoice record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1]">
              <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600">No store visit invoices found</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Generate a new invoice using the "New Walk-in Invoice" tab above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Adminvisitinvoice;
