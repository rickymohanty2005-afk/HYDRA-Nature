import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  Eye,
  Check,
  AlertCircle,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Package,
  UploadCloud,
  Star,
  Loader2,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { getImageUrl } from '../../utils/imageUrl';

const COMMON_SKIN_TYPES = ['All Skin Types', 'Dry', 'Oily', 'Sensitive', 'Combination', 'Normal'];
const COMMON_CATEGORIES = ['Face Care', 'Body Care', 'Hair Care', 'Skincare Sets', 'Natural Care', 'Organic Range'];
const COMMON_SUBCATEGORIES = ['Serums', 'Moisturizers', 'Cleansers', 'Sunscreens', 'Essentials', 'Masks', 'Oils'];
const COMMON_TAGS = ['Best Seller', 'New', 'Trending', 'Organic', 'Limited'];
const MAX_FEATURED_PRODUCTS = 4;

type ProductFlag = 'isBestSeller' | 'isFeatured';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(999);
  const [originalPrice, setOriginalPrice] = useState<number>(1299);
  const [category, setCategory] = useState('Face Care');
  const [customCategory, setCustomCategory] = useState('');
  const [subcategory, setSubcategory] = useState('Serums');
  const [customSubcategory, setCustomSubcategory] = useState('');
  const [tag, setTag] = useState<string>('New');
  const [customTag, setCustomTag] = useState('');

  // Images state: Starts completely EMPTY (NO predefined photo!)
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stock, setStock] = useState<number>(50);
  const [size, setSize] = useState('50ml');
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>(['All Skin Types']);
  const [ingredients, setIngredients] = useState('Botanical Squalane, Hyaluronic Acid, Vitamin C');
  const [keyBenefits, setKeyBenefits] = useState('72-Hour Hydration, Illuminating Glow, Barrier Repair');
  const [howToUse, setHowToUse] = useState('Apply 2-3 drops to cleansed skin morning and evening.');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [updatingFlags, setUpdatingFlags] = useState<Record<string, boolean>>({});

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({ limit: 100, all: true });
      setProducts(res.data || []);
    } catch (err: any) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductFlag = async (product: Product, flag: ProductFlag) => {
    const nextValue = !product[flag];
    if (flag === 'isFeatured' && nextValue) {
      const featuredCount = products.filter((item) => item.isFeatured && item._id !== product._id).length;
      if (featuredCount >= MAX_FEATURED_PRODUCTS) {
        alert(`Only ${MAX_FEATURED_PRODUCTS} products can be featured in Top Picks at a time.`);
        return;
      }
    }

    setUpdatingFlags((current) => ({ ...current, [product._id]: true }));
    try {
      await productService.update(product._id, { [flag]: nextValue });
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? { ...item, [flag]: nextValue } : item))
      );
      showNotification(
        `${product.name}: ${flag === 'isBestSeller' ? 'Best Seller' : 'Top Picks'} turned ${
          nextValue ? 'ON' : 'OFF'
        }`
      );
    } catch (error) {
      console.error(`Failed to update ${flag} for ${product.name}:`, error);
      alert(`Could not update ${flag === 'isBestSeller' ? 'Best Seller' : 'Top Picks'} status.`);
    } finally {
      setUpdatingFlags((current) => ({ ...current, [product._id]: false }));
    }
  };

  const handleQuickUpdateTag = async (product: Product, newTag: string) => {
    const tagToSave = newTag === 'None' ? '' : newTag;
    setUpdatingFlags((current) => ({ ...current, [`${product._id}-tag`]: true }));
    try {
      await productService.update(product._id, { tag: tagToSave });
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? { ...item, tag: tagToSave } : item))
      );
      showNotification(
        `${product.name}: Tag ${tagToSave ? `"${tagToSave}" (ON)` : 'turned OFF'}`
      );
    } catch (error) {
      console.error('Failed to update tag:', error);
      alert('Could not update tag badge.');
    } finally {
      setUpdatingFlags((current) => ({ ...current, [`${product._id}-tag`]: false }));
    }
  };

  const handleToggleTag = async (product: Product) => {
    const nextTag = product.tag ? '' : 'New';
    await handleQuickUpdateTag(product, nextTag);
  };

  const handleFeaturedChange = (checked: boolean) => {
    if (checked) {
      const featuredCount = products.filter((item) => item.isFeatured && item._id !== editingProduct?._id).length;
      if (featuredCount >= MAX_FEATURED_PRODUCTS) {
        alert(`Only ${MAX_FEATURED_PRODUCTS} products can be featured in Top Picks at a time.`);
        return;
      }
    }
    setIsFeatured(checked);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Open modal for NEW formulation - NO predefined photo attached!
  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSubtitle('');
    setDescription('');
    setPrice(999);
    setOriginalPrice(1299);
    setCategory('Face Care');
    setCustomCategory('');
    setSubcategory('Serums');
    setCustomSubcategory('');
    setTag('New');
    setCustomTag('');

    // Crucial: images starts 100% EMPTY - No predefined/hardcoded photo!
    setImages([]);
    setImageUrlInput('');

    setStock(50);
    setSize('50ml');
    setSelectedSkinTypes(['All Skin Types']);
    setIngredients('Botanical Squalane, Hyaluronic Acid, Vitamin C');
    setKeyBenefits('72-Hour Hydration, Illuminating Glow, Barrier Repair');
    setHowToUse('Warm 2-3 drops between clean palms and press gently into face and neck.');
    setIsBestSeller(false);
    setIsFeatured(false);
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for EDITING existing formulation
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSubtitle(p.subtitle || '');
    setDescription(p.description);
    setPrice(p.price);
    setOriginalPrice(p.originalPrice || p.price);

    if (COMMON_CATEGORIES.includes(p.category)) {
      setCategory(p.category);
      setCustomCategory('');
    } else {
      setCategory('Custom');
      setCustomCategory(p.category);
    }

    if (p.subcategory && COMMON_SUBCATEGORIES.includes(p.subcategory)) {
      setSubcategory(p.subcategory);
      setCustomSubcategory('');
    } else if (p.subcategory) {
      setSubcategory('Custom');
      setCustomSubcategory(p.subcategory);
    } else {
      setSubcategory('None');
      setCustomSubcategory('');
    }

    if (p.tag && COMMON_TAGS.includes(p.tag)) {
      setTag(p.tag);
      setCustomTag('');
    } else if (p.tag) {
      setTag('Custom');
      setCustomTag(p.tag);
    } else {
      setTag('None');
      setCustomTag('');
    }

    // Load actual product images or empty if none
    setImages(p.images && p.images.length > 0 ? p.images : []);
    setImageUrlInput('');
    setStock(p.stock !== undefined ? p.stock : 50);
    setSize(p.size || '50ml');
    setSelectedSkinTypes(p.skinType && p.skinType.length > 0 ? p.skinType : ['All Skin Types']);
    setIngredients(p.ingredients?.join(', ') || '');
    setKeyBenefits(p.keyBenefits?.join(', ') || '');
    setHowToUse(p.howToUse?.join('\n') || '');
    setIsBestSeller(Boolean(p.isBestSeller));
    setIsFeatured(p.isFeatured !== undefined ? Boolean(p.isFeatured) : true);
    setIsActive(p.isActive !== undefined ? Boolean(p.isActive) : true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Multer file upload for single or multiple files
  const processFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      alert('Please select valid image files (JPG, PNG, WEBP, AVIF).');
      return;
    }

    // Instant local preview so images display IMMEDIATELY to the admin without delay!
    const localPreviews = fileArray.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...localPreviews]);

    setUploadingImage(true);
    setUploadStatusText(`Uploading ${fileArray.length} formulation photo${fileArray.length > 1 ? 's' : ''}...`);

    try {
      let uploadedUrls: string[] = [];

      if (fileArray.length === 1) {
        const res = await productService.uploadImage(fileArray[0]);
        if (res && res.imageUrl) {
          uploadedUrls = [res.imageUrl];
        }
      } else {
        const res = await productService.uploadMultipleImages(fileArray);
        if (res && res.imageUrls) {
          uploadedUrls = res.imageUrls;
        }
      }

      if (uploadedUrls.length > 0) {
        // Swap out the temporary blob preview URLs with permanent stored URLs from Multer
        setImages((prev) => {
          const withoutPreviews = prev.filter((img) => !localPreviews.includes(img));
          return [...withoutPreviews, ...uploadedUrls];
        });
        showNotification(`Successfully stored ${uploadedUrls.length} formulation photo(s)!`);
      }
    } catch (err: any) {
      // Revert temporary previews on error
      setImages((prev) => prev.filter((img) => !localPreviews.includes(img)));
      alert(err.message || 'Image upload failed. Please ensure the backend server is running on port 5012.');
    } finally {
      setUploadingImage(false);
      setUploadStatusText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesUpload(e.target.files);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesUpload(e.dataTransfer.files);
    }
  };

  // Set any image as the primary cover photo (moves to index 0)
  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const selected = images[index];
    const filtered = images.filter((_, i) => i !== index);
    setImages([selected, ...filtered]);
    showNotification('Set as primary cover photo!');
  };

  // Remove an image from gallery
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Add external image URL
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput('');
      showNotification('Image URL added to gallery!');
    }
  };

  const handleToggleSkinType = (type: string) => {
    if (selectedSkinTypes.includes(type)) {
      if (selectedSkinTypes.length > 1) {
        setSelectedSkinTypes(selectedSkinTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedSkinTypes([...selectedSkinTypes, type]);
    }
  };

  const handleToggleActiveStatus = async (p: Product) => {
    try {
      const newActive = !p.isActive;
      await productService.update(p._id, { isActive: newActive });
      setProducts(products.map((item) => (item._id === p._id ? { ...item, isActive: newActive } : item)));
      showNotification(`Formulation is now ${newActive ? 'Active' : 'Draft / Inactive'}`);
    } catch (err) {
      alert('Failed to update product status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      try {
        await productService.delete(id);
        setProducts(products.filter((p) => p._id !== id));
        showNotification('Formulation deleted successfully');
      } catch (err) {
        alert('Failed to delete formulation');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      // Validation: ensure at least one real formulation photo is uploaded!
      if (images.length === 0) {
        throw new Error('Please upload at least one product photo for this formulation before publishing.');
      }

      const finalCategory = category === 'Custom' ? customCategory.trim() : category;
      if (!finalCategory) {
        throw new Error('Please specify a category for this formulation.');
      }

      let finalSubcategory = '';
      if (subcategory === 'Custom') {
        finalSubcategory = customSubcategory.trim();
      } else if (subcategory !== 'None') {
        finalSubcategory = subcategory;
      }

      let finalTag = '';
      if (tag === 'Custom') {
        finalTag = customTag.trim();
      } else if (tag !== 'None') {
        finalTag = tag;
      }

      const payload: Partial<Product> = {
        name: name.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        price: Number(price),
        originalPrice: Number(originalPrice || price),
        category: finalCategory,
        subcategory: finalSubcategory || undefined,
        tag: finalTag || '',
        images: images.filter(Boolean),
        stock: Number(stock),
        size: size.trim() || '50ml',
        skinType: selectedSkinTypes,
        ingredients: ingredients.split(',').map((s) => s.trim()).filter(Boolean),
        keyBenefits: keyBenefits.split(',').map((s) => s.trim()).filter(Boolean),
        howToUse: howToUse.split('\n').map((s) => s.trim()).filter(Boolean),
        isBestSeller,
        isFeatured,
        isActive,
      };

      if (editingProduct) {
        await productService.update(editingProduct._id, payload);
        showNotification('Formulation updated successfully!');
      } else {
        await productService.create(payload);
        showNotification('New formulation created and stored successfully!');
      }

      await fetchProducts();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving formulation');
    } finally {
      setFormSubmitting(false);
    }
  };

  const availableCategories = Array.from(
    new Set([...COMMON_CATEGORIES, ...products.map((p) => p.category).filter(Boolean)])
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = categoryFilter === 'All' || p.category.toLowerCase() === categoryFilter.toLowerCase();

    let matchesStatus = true;
    if (statusFilter === 'Active') matchesStatus = p.isActive !== false;
    if (statusFilter === 'Inactive') matchesStatus = p.isActive === false;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const activeCount = products.filter((p) => p.isActive !== false).length;
  const draftCount = products.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#13382B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-[#EDE8E1]/20">
          <CheckCircle2 className="w-4 h-4 text-[#A2B997]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-[#13382B]">Products Catalog</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF1EB] text-[#2E6B48]">
              {products.length} Formulations
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time dynamic skincare formulation management. Upload photography and save directly into MongoDB.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#13382B] text-white rounded-xl text-xs font-semibold hover:bg-[#1E4D3B] transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Formulation</span>
        </button>
      </div>

      {/* Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <p className="text-[11px] text-gray-500 font-medium">Total Formulations</p>
          <p className="font-serif text-xl font-bold text-[#13382B] mt-1">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <p className="text-[11px] text-gray-500 font-medium">Active in Store</p>
          <p className="font-serif text-xl font-bold text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <p className="text-[11px] text-gray-500 font-medium">Draft / Inactive</p>
          <p className="font-serif text-xl font-bold text-amber-600 mt-1">{draftCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <p className="text-[11px] text-gray-500 font-medium">Low Stock (&le;10)</p>
          <p className="font-serif text-xl font-bold text-red-600 mt-1">
            {products.filter((p) => p.stock <= 10).length}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EDE8E1] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, subtitle, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Drafts Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-[#EDE8E1] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FAF8F5] text-gray-500 font-semibold uppercase text-[10px]">
                <th className="py-3.5 px-6">Formulation</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Pricing</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Tags & Flags</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading formulations catalog...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const hasPhoto = p.images && p.images.length > 0 && p.images[0];
                  return (
                    <tr key={p._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {hasPhoto ? (
                            <img
                              src={getImageUrl(p.images[0])}
                              alt={p.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80';
                              }}
                              className="w-12 h-12 object-contain rounded-xl bg-[#FAF8F5] p-1 border border-[#EDE8E1] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 flex-shrink-0">
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-[8px] mt-0.5">No photo</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-serif font-bold text-gray-900 line-clamp-1">{p.name}</p>
                            <p className="text-[11px] text-gray-400 line-clamp-1">{p.subtitle || p.size}</p>
                            <span className="text-[10px] text-gray-400 font-mono">/{p.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-700">{p.category}</span>
                        {p.subcategory && (
                          <p className="text-[10px] text-gray-400 font-sans mt-0.5">{p.subcategory}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-[#13382B]">
                          ₹{p.price.toLocaleString('en-IN')}
                        </div>
                        {p.originalPrice > p.price && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 line-through">
                              ₹{p.originalPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              {p.discountPercentage || Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% off
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.stock <= 0
                              ? 'bg-red-100 text-red-800'
                              : p.stock <= 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock <= 0 ? 'Out of Stock' : `${p.stock} units`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5 min-w-[190px]">
                          {/* Tag Badge Control (ON/OFF + Quick Switch) */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleTag(p)}
                              disabled={Boolean(updatingFlags[`${p._id}-tag`])}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all flex items-center gap-1 border ${
                                p.tag
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                              }`}
                              title={p.tag ? `Tag is ON ("${p.tag}"). Click to turn OFF` : 'Tag is OFF. Click to turn ON'}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.tag ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span>{p.tag ? `Tag: ${p.tag}` : 'Tag: OFF'}</span>
                            </button>

                            <select
                              value={p.tag || 'None'}
                              onChange={(e) => handleQuickUpdateTag(p, e.target.value)}
                              disabled={Boolean(updatingFlags[`${p._id}-tag`])}
                              className="text-[9px] font-medium bg-white border border-gray-200 rounded-md px-1 py-0.5 text-gray-700 cursor-pointer focus:outline-none"
                              title="Select Tag for this formulation"
                            >
                              <option value="None">None (OFF)</option>
                              {COMMON_TAGS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Flags Row: Best Seller & Top Picks */}
                          <div className="flex items-center gap-1">
                            {/* Best Seller ON/OFF */}
                            <button
                              type="button"
                              onClick={() => handleToggleProductFlag(p, 'isBestSeller')}
                              disabled={Boolean(updatingFlags[p._id])}
                              aria-pressed={Boolean(p.isBestSeller)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all flex items-center gap-1 border ${
                                p.isBestSeller
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
                                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                              }`}
                              title={`Click to turn Best Seller ${p.isBestSeller ? 'OFF' : 'ON'}`}
                            >
                              <span>★ Best Seller</span>
                              <span
                                className={`px-1 py-0.2 rounded text-[8px] ${
                                  p.isBestSeller ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {p.isBestSeller ? 'ON' : 'OFF'}
                              </span>
                            </button>

                            {/* Top Picks ON/OFF */}
                            <button
                              type="button"
                              onClick={() => handleToggleProductFlag(p, 'isFeatured')}
                              disabled={Boolean(updatingFlags[p._id])}
                              aria-pressed={Boolean(p.isFeatured)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all flex items-center gap-1 border ${
                                p.isFeatured
                                  ? 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100 shadow-xs'
                                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                              }`}
                              title={`Click to turn Top Picks ${p.isFeatured ? 'OFF' : 'ON'}`}
                            >
                              <span>✦ Top Picks</span>
                              <span
                                className={`px-1 py-0.2 rounded text-[8px] ${
                                  p.isFeatured ? 'bg-purple-200 text-purple-900' : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {p.isFeatured ? 'ON' : 'OFF'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActiveStatus(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                            p.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title="Click to toggle store visibility"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.isActive !== false ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          <span>{p.isActive !== false ? 'Active' : 'Draft'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/shop/${p.slug || p._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-[#13382B] rounded-lg hover:bg-gray-100 transition-colors"
                            title="View Live Store Page"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-500 hover:text-[#13382B] rounded-lg hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No formulations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-[#EDE8E1] shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6B48]">
                Inventory Formulation
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#13382B]">
                {editingProduct ? 'Edit Formulation' : 'Add New Formulation'}
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-2">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydra Celestial Barrier Glaze"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                />
              </div>

              {/* Subtitle / Highlights */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subtitle / Botanical Highlights
                </label>
                <input
                  type="text"
                  placeholder="e.g. Micro-Algae • Botanical Ceramides • Niacinamide"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe active cellular mechanisms, texture, and proven skin results..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                />
              </div>

              {/* Pricing & Volume */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Original Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl"
                  />
                  {originalPrice > price && (
                    <p className="text-[10px] text-emerald-700 mt-0.5">
                      {Math.round(((originalPrice - price) / originalPrice) * 100)}% discount badge
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Volume / Size
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 50ml or 100ml"
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl"
                  />
                </div>
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl bg-white"
                  >
                    {COMMON_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Custom">+ Custom Category...</option>
                  </select>
                  {category === 'Custom' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter new category name..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2 w-full px-3.5 py-1.5 text-xs border border-emerald-300 rounded-xl"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subcategory</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl bg-white"
                  >
                    <option value="None">None</option>
                    {COMMON_SUBCATEGORIES.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                    <option value="Custom">+ Custom Subcategory...</option>
                  </select>
                  {subcategory === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter new subcategory name..."
                      value={customSubcategory}
                      onChange={(e) => setCustomSubcategory(e.target.value)}
                      className="mt-2 w-full px-3.5 py-1.5 text-xs border border-emerald-300 rounded-xl"
                    />
                  )}
                </div>
              </div>

              {/* Tag & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Special Tag Badge</label>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      tag && tag !== 'None' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tag && tag !== 'None' ? `Tag: ON (${tag})` : 'Tag: OFF'}
                    </span>
                  </div>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl bg-white"
                  >
                    <option value="None">None (OFF - Hide Tag Badge)</option>
                    {COMMON_TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t} (ON)
                      </option>
                    ))}
                    <option value="Custom">+ Custom Tag... (ON)</option>
                  </select>
                  {tag === 'Custom' && (
                    <input
                      type="text"
                      placeholder="e.g. Limited Edition"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      className="mt-2 w-full px-3.5 py-1.5 text-xs border border-emerald-300 rounded-xl"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Units *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl"
                  />
                </div>
              </div>

              {/* PRODUCT PHOTOGRAPHY GALLERY UPLOAD SYSTEM */}
              <div className="border border-[#EDE8E1] rounded-2xl p-5 bg-[#FAF8F5]/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#13382B]" />
                      <span>Product Photography Gallery *</span>
                    </label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload high-resolution formulation photos. First image is automatically the primary storefront cover photo.
                    </p>
                  </div>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#13382B] text-white rounded-xl text-xs font-semibold hover:bg-[#1E4D3B] transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Add More</span>
                    </button>
                  )}
                </div>

                {/* Hidden Multi-file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {/* Upload Status Alert */}
                {uploadingImage && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 border border-emerald-200 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>{uploadStatusText || 'Uploading images via Multer...'}</span>
                  </div>
                )}

                {/* If NO photos uploaded: Big Interactive Drop Zone */}
                {images.length === 0 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-white ${
                      isDragging
                        ? 'border-[#13382B] bg-[#EAF1EB]/50 scale-[1.01]'
                        : 'border-[#D1C7BD] hover:border-[#13382B] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-[#EAF1EB] text-[#13382B] flex items-center justify-center mb-3 shadow-inner">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      Click to browse or drag & drop formulation images
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      Upload multiple JPEG, PNG, WEBP, or AVIF photography (up to 10MB each).
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-[#13382B] text-white text-xs font-semibold rounded-full shadow hover:bg-[#1E4D3B] transition-all"
                    >
                      Select Image Files
                    </button>
                  </div>
                ) : (
                  /* If photos exist: Render Thumbnail Grid */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative group rounded-2xl bg-white border p-1.5 shadow-sm transition-all overflow-hidden ${
                            idx === 0
                              ? 'border-[#13382B] ring-2 ring-[#13382B]/20'
                              : 'border-[#EDE8E1] hover:border-[#13382B]'
                          }`}
                        >
                          <div className="aspect-square w-full rounded-xl overflow-hidden bg-[#FAF8F5] flex items-center justify-center relative">
                            <img
                              src={getImageUrl(imgUrl)}
                              alt="Formulation preview"
                              onError={(e) => {
                                console.error('Image load error for:', imgUrl);
                              }}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            {imgUrl.startsWith('blob:') && uploadingImage && (
                              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                              </div>
                            )}
                          </div>

                          {/* Primary Cover Badge */}
                          {idx === 0 ? (
                            <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#13382B] text-white text-[9px] font-bold rounded-full shadow flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current text-[#C5A880]" />
                              <span>Cover</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 backdrop-blur-sm hover:bg-[#13382B] hover:text-white text-gray-700 text-[9px] font-bold rounded-full shadow transition-all opacity-0 group-hover:opacity-100"
                              title="Set as primary cover photo"
                            >
                              Make Cover
                            </button>
                          )}

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-3 right-3 w-6 h-6 bg-red-600/90 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Dropzone card to add more */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="aspect-square rounded-2xl border-2 border-dashed border-[#D1C7BD] hover:border-[#13382B] bg-white hover:bg-[#FAF8F5] flex flex-col items-center justify-center cursor-pointer transition-all p-2 text-center"
                      >
                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#13382B]" />
                        <span className="text-[11px] font-semibold text-gray-600 mt-1">Add Photo</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional External Image URL input */}
                <div className="pt-2 border-t border-gray-200/60">
                  <p className="text-[11px] text-gray-500 mb-1.5">Or add image via URL:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Paste external image URL (e.g. https://...)..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#EDE8E1] rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-1.5 bg-[#FAF8F5] border border-[#EDE8E1] hover:bg-[#EDE8E1] text-gray-800 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Attach URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Skin Types Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Suitable Skin Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKIN_TYPES.map((st) => {
                    const isSelected = selectedSkinTypes.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleToggleSkinType(st)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#13382B] text-white shadow-sm'
                            : 'bg-[#FAF8F5] text-gray-600 border border-[#EDE8E1] hover:bg-gray-100'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Ingredients */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Key Botanical Ingredients (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Botanical Squalane, Marine Micro-Algae, Niacinamide"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none"
                />
              </div>

              {/* Key Benefits */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Clinical & Skin Benefits (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="72-Hour Hydro-Lock, Glass Skin Glow, Barrier Repair"
                  value={keyBenefits}
                  onChange={(e) => setKeyBenefits(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none"
                />
              </div>

              {/* How to Use */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  How to Use Ritual Steps (One per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="Step 1: Cleanse skin thoroughly...&#10;Step 2: Press 2-3 drops into face..."
                  value={howToUse}
                  onChange={(e) => setHowToUse(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none"
                />
              </div>

              {/* Toggles: Active, Best Seller, Featured (Storefront Flags) */}
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2">
                  Storefront Visibility & Flags (Attached to Shop Card)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#13382B] focus:ring-[#13382B]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-900">Active in Store</p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isActive ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">Live on storefront catalog</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      isBestSeller ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="w-4 h-4 rounded text-[#13382B] focus:ring-[#13382B]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-900">★ Best Seller</p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isBestSeller ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isBestSeller ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">Attaches luxury Best Seller badge</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      isFeatured ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => handleFeaturedChange(e.target.checked)}
                      className="w-4 h-4 rounded text-[#13382B] focus:ring-[#13382B]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-900">✦ Top Picks</p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isFeatured ? 'bg-purple-200 text-purple-900' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isFeatured ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">Attaches Top Pick badge</p>
                    </div>
                  </label>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingImage}
                  className="px-6 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{formSubmitting ? 'Saving Formulation...' : editingProduct ? 'Save Changes' : 'Create & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
