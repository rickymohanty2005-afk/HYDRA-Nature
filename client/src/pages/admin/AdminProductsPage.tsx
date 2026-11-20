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
  AlertCircle,
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
const MAX_PRODUCT_IMAGES = 6;

type ProductFlag = 'isBestSeller' | 'isFeatured';

/* ── Shared UI class strings (presentation only) ── */
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#13382B]';
const hintCls = 'mt-1 text-[12px] text-stone-500';
const inputCls =
  'w-full rounded-[10px] border border-[#E2DBD1] bg-white px-3.5 py-2.5 text-[13px] text-stone-800 placeholder:text-stone-400 transition-colors focus:border-[#13382B] focus:outline-none focus:ring-2 focus:ring-[#13382B]/10';
const selectCls = `${inputCls} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9`;
const sectionTitleCls = 'font-serif text-[17px] font-semibold text-[#13382B]';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13382B]/40 focus-visible:ring-offset-1';

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

  // Images state: starts completely empty (no predefined photo)
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrlError, setImageUrlError] = useState('');
  const [checkingImageUrl, setCheckingImageUrl] = useState(false);
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
      showNotification(`${product.name}: Tag ${tagToSave ? `"${tagToSave}" (ON)` : 'turned OFF'}`);
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

  // Open modal for a NEW product — no predefined photo attached
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

    // Images start empty — no predefined/hardcoded photo
    setImages([]);
    setImageUrlInput('');
    setImageUrlError('');

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

  // Open modal for EDITING an existing product
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
    setImageUrlError('');
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
    let fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      alert('Please select valid image files (JPG, PNG, WEBP, AVIF).');
      return;
    }

    const slotsLeft = MAX_PRODUCT_IMAGES - images.length;
    if (slotsLeft <= 0) {
      alert(`You can attach a maximum of ${MAX_PRODUCT_IMAGES} product photos.`);
      return;
    }
    if (fileArray.length > slotsLeft) {
      alert(`Only ${MAX_PRODUCT_IMAGES} photos are allowed. Adding the first ${slotsLeft} selected photo${slotsLeft > 1 ? 's' : ''}.`);
      fileArray = fileArray.slice(0, slotsLeft);
    }

    // Instant local preview so images display immediately
    const localPreviews = fileArray.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...localPreviews]);

    setUploadingImage(true);
    setUploadStatusText(`Uploading ${fileArray.length} photo${fileArray.length > 1 ? 's' : ''}…`);

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
        // Swap the temporary blob preview URLs for the permanent stored URLs
        setImages((prev) => {
          const withoutPreviews = prev.filter((img) => !localPreviews.includes(img));
          return [...withoutPreviews, ...uploadedUrls];
        });
        showNotification(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} uploaded`);
      }
    } catch (err: any) {
      // Revert temporary previews on error
      setImages((prev) => prev.filter((img) => !localPreviews.includes(img)));
      alert(err.message || 'Image upload failed. Please make sure the backend server is running on port 5012.');
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
    showNotification('Cover photo updated');
  };

  // Remove an image from the gallery
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Convert common share links into direct image links
  const normalizeImageUrl = (raw: string): string => {
    let url = raw.trim();
    if (!url) return '';
    if (url.startsWith('//')) url = `https:${url}`;
    if (/^www\./i.test(url)) url = `https://${url}`;

    // Google Drive: /file/d/<id>/view or open?id=<id>  ->  direct thumbnail link
    const driveMatch =
      url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i) ||
      url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([^&#]+)/i);
    if (driveMatch) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1600`;

    // Dropbox: force raw file instead of preview page
    if (/dropbox\.com\//i.test(url)) {
      try {
        const u = new URL(url);
        u.searchParams.delete('dl');
        u.searchParams.set('raw', '1');
        return u.toString();
      } catch {
        return url;
      }
    }

    // GitHub blob page -> raw file
    const gh = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i);
    if (gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}`;

    return url;
  };

  // Verify the URL actually loads as an image in the browser
  const verifyImageLoads = (src: string, timeoutMs = 12000): Promise<boolean> =>
    new Promise((resolve) => {
      const img = new Image();
      const timer = window.setTimeout(() => {
        img.src = '';
        resolve(false);
      }, timeoutMs);
      img.onload = () => {
        window.clearTimeout(timer);
        resolve(img.naturalWidth > 0);
      };
      img.onerror = () => {
        window.clearTimeout(timer);
        resolve(false);
      };
      img.referrerPolicy = 'no-referrer';
      img.src = src;
    });

  // Add external image URL. Returns the added URL (or null if rejected).
  const handleAddImageUrl = async (): Promise<string | null> => {
    setImageUrlError('');
    const url = normalizeImageUrl(imageUrlInput);
    if (!url) {
      setImageUrlError('Paste an image URL first.');
      return null;
    }

    const isDataImage = /^data:image\//i.test(url);
    const isRelativeUpload = url.startsWith('/uploads/') || url.startsWith('uploads/');
    if (!isDataImage && !isRelativeUpload) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
      } catch {
        setImageUrlError('That is not a valid link. It must start with http:// or https://');
        return null;
      }
    }

    if (images.length >= MAX_PRODUCT_IMAGES) {
      setImageUrlError(`Maximum ${MAX_PRODUCT_IMAGES} photos allowed. Remove one to add another.`);
      return null;
    }

    if (images.includes(url)) {
      setImageUrlError('This image is already in the gallery.');
      return null;
    }

    setCheckingImageUrl(true);
    const ok = await verifyImageLoads(getImageUrl(url));
    setCheckingImageUrl(false);

    if (!ok) {
      setImageUrlError(
        'Couldn’t load an image from this link. Use a direct image address (right-click the image → “Copy image address”), not a web page link.'
      );
      return null;
    }

    setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setImageUrlInput('');
    showNotification('Image added to gallery');
    return url;
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
      showNotification(`${p.name} is now ${newActive ? 'active' : 'a draft'}`);
    } catch (err) {
      alert('Failed to update product status.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      try {
        await productService.delete(id);
        setProducts(products.filter((p) => p._id !== id));
        showNotification('Product deleted');
      } catch (err) {
        alert('Failed to delete product.');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      // Auto-attach a pasted-but-not-attached image URL so it isn't lost
      let finalImages = images.filter((img) => img && !img.startsWith('blob:'));
      if (imageUrlInput.trim()) {
        const added = await handleAddImageUrl();
        if (!added) {
          throw new Error('The image URL you pasted could not be loaded. Fix or clear it before saving.');
        }
        if (!finalImages.includes(added)) finalImages = [...finalImages, added];
      }

      if (uploadingImage) {
        throw new Error('Please wait for image uploads to finish before saving.');
      }

      // Validation: ensure at least one real product photo is uploaded
      if (finalImages.length === 0) {
        throw new Error('Add at least one product photo before publishing.');
      }
      if (finalImages.length > MAX_PRODUCT_IMAGES) {
        throw new Error(`A product can have at most ${MAX_PRODUCT_IMAGES} photos. Remove ${finalImages.length - MAX_PRODUCT_IMAGES} to continue.`);
      }

      const finalCategory = category === 'Custom' ? customCategory.trim() : category;
      if (!finalCategory) {
        throw new Error('Enter a category for this product.');
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
        images: finalImages,
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
        showNotification('Changes saved');
      } else {
        await productService.create(payload);
        showNotification('Product created and published');
      }

      await fetchProducts();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Could not save this product.');
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
  const lowStockCount = products.filter((p) => p.stock <= 10).length;
  const featuredCount = products.filter((p) => p.isFeatured).length;
  const discountPct =
    originalPrice > price && originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="space-y-6 text-stone-800 antialiased">
      {/* Toast notification */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-center gap-3 rounded-2xl bg-[#13382B] py-3 pl-4 pr-5 text-[13px] font-medium text-white shadow-[0_18px_40px_-12px_rgba(19,56,43,0.55)] animate-fade-in"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#A2B997]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── Page header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-[28px] font-semibold leading-tight text-[#13382B]">Products</h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-stone-500">
            Manage your catalogue, product photos, pricing and storefront badges.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className={`inline-flex items-center gap-2 self-start rounded-full bg-[#13382B] py-2.5 pl-4 pr-5 text-[13px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(19,56,43,0.7)] transition-colors hover:bg-[#1E4D3B] sm:self-auto ${focusRing}`}
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </header>

      {/* ── Summary strip ── */}
      <section
        aria-label="Catalogue summary"
        className="grid grid-cols-2 divide-[#EDE8E1] overflow-hidden rounded-2xl border border-[#EDE8E1] bg-white sm:grid-cols-4 sm:divide-x"
      >
        {[
          { label: 'Total products', value: products.length, tone: 'text-[#13382B]' },
          { label: 'Active in store', value: activeCount, tone: 'text-emerald-700' },
          { label: 'Drafts', value: draftCount, tone: 'text-amber-700' },
          { label: 'Low stock (≤ 10)', value: lowStockCount, tone: lowStockCount > 0 ? 'text-red-600' : 'text-[#13382B]' },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-4 ${i < 2 ? 'border-b border-[#EDE8E1] sm:border-b-0' : ''} ${i % 2 === 0 ? 'border-r border-[#EDE8E1] sm:border-r-0' : ''}`}
          >
            <p className="text-[12px] text-stone-500">{s.label}</p>
            <p className={`mt-1 font-serif text-[26px] font-semibold leading-none tabular-nums ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </section>

      {/* ── Products table card ── */}
      <section className="overflow-hidden rounded-3xl border border-[#EDE8E1] bg-white">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#EDE8E1] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search name, subtitle or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputCls} bg-[#FAF8F5] pl-10`}
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <label className="sr-only" htmlFor="category-filter">
              Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`${selectCls} w-auto min-w-[160px] bg-[#FAF8F5] py-2`}
            >
              <option value="All">All categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status filter as segmented control */}
            <div role="group" aria-label="Status filter" className="inline-flex rounded-full border border-[#E2DBD1] bg-[#FAF8F5] p-0.5">
              {(['All', 'Active', 'Inactive'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${focusRing} ${
                    statusFilter === s ? 'bg-[#13382B] text-white shadow-sm' : 'text-stone-600 hover:text-[#13382B]'
                  }`}
                >
                  {s === 'Inactive' ? 'Drafts' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-[13px]">
            <thead>
              <tr className="bg-[#FAF8F5] text-[12px] font-medium text-stone-500">
                <th scope="col" className="px-6 py-3 font-medium">Product</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Price</th>
                <th scope="col" className="px-4 py-3 font-medium">Stock</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Badges
                  <span className="ml-1.5 font-normal text-stone-400">
                    (Top Picks {featuredCount}/{MAX_FEATURED_PRODUCTS})
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-6 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1ECE5]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#13382B]" />
                    Loading products…
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const hasPhoto = p.images && p.images.length > 0 && p.images[0];
                  return (
                    <tr key={p._id} className="align-middle transition-colors hover:bg-[#FCFBF9]">
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          {hasPhoto ? (
                            <img loading="lazy" decoding="async"
                              src={getImageUrl(p.images[0])}
                              alt={p.name}
                              onError={(e) => {
                                const el = e.target as HTMLImageElement;
                                if (!el.src.endsWith('/images/placeholder.svg')) el.src = '/images/placeholder.svg';
                              }}
                              className="h-14 w-14 flex-shrink-0 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-[#D9D0C4] bg-[#FAF8F5] text-stone-400">
                              <ImageIcon className="h-4 w-4" />
                              <span className="mt-0.5 text-[10px]">No photo</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-serif text-[15px] font-semibold text-stone-900">{p.name}</p>
                            <p className="line-clamp-1 text-[12px] text-stone-500">{p.subtitle || p.size}</p>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-400">/{p.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-stone-700">{p.category}</p>
                        {p.subcategory && <p className="mt-0.5 text-[12px] text-stone-400">{p.subcategory}</p>}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4 tabular-nums">
                        <p className="font-semibold text-[#13382B]">₹{p.price.toLocaleString('en-IN')}</p>
                        {p.originalPrice > p.price && (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="text-[12px] text-stone-400 line-through">
                              ₹{p.originalPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                              {p.discountPercentage || Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% off
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium tabular-nums ${
                            p.stock <= 0
                              ? 'bg-red-50 text-red-700'
                              : p.stock <= 10
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-[#EAF1EB] text-[#2E6B48]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.stock <= 0 ? 'bg-red-500' : p.stock <= 10 ? 'bg-amber-500' : 'bg-[#2E6B48]'
                            }`}
                          />
                          {p.stock <= 0 ? 'Out of stock' : `${p.stock} units`}
                        </span>
                      </td>

                      {/* Badges */}
                      <td className="px-4 py-4">
                        <div className="flex min-w-[230px] flex-col gap-2">
                          {/* Tag badge: on/off + quick switch */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleTag(p)}
                              disabled={Boolean(updatingFlags[`${p._id}-tag`])}
                              aria-pressed={Boolean(p.tag)}
                              title={p.tag ? `Tag is on ("${p.tag}"). Click to turn off.` : 'Tag is off. Click to turn on.'}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-60 ${focusRing} ${
                                p.tag
                                  ? 'border-[#B9D1BE] bg-[#EAF1EB] text-[#13382B] hover:bg-[#DFEBE1]'
                                  : 'border-[#E2DBD1] bg-white text-stone-500 hover:bg-[#FAF8F5]'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${p.tag ? 'bg-[#2E6B48]' : 'bg-stone-300'}`} />
                              {p.tag ? p.tag : 'No tag'}
                            </button>

                            <select
                              value={p.tag || 'None'}
                              onChange={(e) => handleQuickUpdateTag(p, e.target.value)}
                              disabled={Boolean(updatingFlags[`${p._id}-tag`])}
                              aria-label={`Change tag for ${p.name}`}
                              className="cursor-pointer rounded-lg border border-[#E2DBD1] bg-white px-1.5 py-1 text-[11px] text-stone-600 focus:border-[#13382B] focus:outline-none disabled:opacity-60"
                            >
                              <option value="None">No tag</option>
                              {COMMON_TAGS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Best Seller & Top Picks */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleProductFlag(p, 'isBestSeller')}
                              disabled={Boolean(updatingFlags[p._id])}
                              aria-pressed={Boolean(p.isBestSeller)}
                              title={`Click to turn Best Seller ${p.isBestSeller ? 'off' : 'on'}`}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-60 ${focusRing} ${
                                p.isBestSeller
                                  ? 'border-[#E3CFA9] bg-[#F7F0E3] text-[#7A5A2B] hover:bg-[#F1E6D2]'
                                  : 'border-[#E2DBD1] bg-white text-stone-400 hover:bg-[#FAF8F5] hover:text-stone-600'
                              }`}
                            >
                              <Star className={`h-3 w-3 ${p.isBestSeller ? 'fill-[#C5A880] text-[#C5A880]' : ''}`} />
                              Best Seller
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleProductFlag(p, 'isFeatured')}
                              disabled={Boolean(updatingFlags[p._id])}
                              aria-pressed={Boolean(p.isFeatured)}
                              title={`Click to turn Top Picks ${p.isFeatured ? 'off' : 'on'}`}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-60 ${focusRing} ${
                                p.isFeatured
                                  ? 'border-[#D7C9DF] bg-[#F3EEF6] text-[#5B3E6B] hover:bg-[#ECE4F1]'
                                  : 'border-[#E2DBD1] bg-white text-stone-400 hover:bg-[#FAF8F5] hover:text-stone-600'
                              }`}
                            >
                              <span aria-hidden="true">✦</span>
                              Top Picks
                            </button>

                            {updatingFlags[p._id] && <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />}
                          </div>
                        </div>
                      </td>

                      {/* Status (switch) */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={p.isActive !== false}
                          onClick={() => handleToggleActiveStatus(p)}
                          title="Click to toggle store visibility"
                          className={`group inline-flex items-center gap-2 rounded-full ${focusRing}`}
                        >
                          <span
                            className={`relative h-5 w-9 rounded-full transition-colors ${
                              p.isActive !== false ? 'bg-[#2E6B48]' : 'bg-stone-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                p.isActive !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`}
                            />
                          </span>
                          <span
                            className={`text-[12px] font-medium ${p.isActive !== false ? 'text-[#2E6B48]' : 'text-stone-500'}`}
                          >
                            {p.isActive !== false ? 'Active' : 'Draft'}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/shop/${p.slug || p._id}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`View ${p.name} in store`}
                            title="View live store page"
                            className={`rounded-lg p-2 text-stone-400 transition-colors hover:bg-[#FAF8F5] hover:text-[#13382B] ${focusRing}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            aria-label={`Edit ${p.name}`}
                            title="Edit"
                            className={`rounded-lg p-2 text-stone-500 transition-colors hover:bg-[#FAF8F5] hover:text-[#13382B] ${focusRing}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p._id, p.name)}
                            aria-label={`Delete ${p.name}`}
                            title="Delete"
                            className={`rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 ${focusRing}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Package className="mx-auto mb-3 h-8 w-8 text-stone-300" />
                    <p className="text-[14px] font-medium text-stone-700">No products match these filters</p>
                    <p className="mt-1 text-[13px] text-stone-500">
                      Try a different search or category, or add a new product.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="border-t border-[#EDE8E1] px-6 py-3 text-[12px] text-stone-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </section>

      {/* ── Add / Edit product modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E211A]/60 p-3 backdrop-blur-sm sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#EDE8E1] bg-white shadow-[0_40px_80px_-30px_rgba(14,33,26,0.6)]"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#EDE8E1] px-6 py-5 sm:px-8">
              <div>
                <h3 id="product-modal-title" className="font-serif text-[22px] font-semibold text-[#13382B]">
                  {editingProduct ? 'Edit product' : 'Add a new product'}
                </h3>
                <p className="mt-0.5 text-[13px] text-stone-500">
                  {editingProduct ? editingProduct.name : 'Fields marked * are required.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className={`rounded-full p-2 text-stone-400 transition-colors hover:bg-[#FAF8F5] hover:text-stone-700 ${focusRing}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6 sm:px-8">
                {/* ── Details ── */}
                <fieldset className="space-y-4">
                  <legend className={`${sectionTitleCls} mb-3`}>Details</legend>

                  <div>
                    <label htmlFor="pf-name" className={labelCls}>
                      Product name *
                    </label>
                    <input
                      id="pf-name"
                      type="text"
                      required
                      placeholder="e.g. Hydra Celestial Barrier Glaze"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="pf-subtitle" className={labelCls}>
                      Subtitle / botanical highlights
                    </label>
                    <input
                      id="pf-subtitle"
                      type="text"
                      placeholder="e.g. Micro-Algae • Botanical Ceramides • Niacinamide"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="pf-desc" className={labelCls}>
                      Full description *
                    </label>
                    <textarea
                      id="pf-desc"
                      rows={4}
                      required
                      placeholder="Describe how it works, the texture and the results customers can expect."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`${inputCls} resize-y leading-relaxed`}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="pf-category" className={labelCls}>
                        Category *
                      </label>
                      <select
                        id="pf-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={selectCls}
                      >
                        {COMMON_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="Custom">+ Custom category…</option>
                      </select>
                      {category === 'Custom' && (
                        <input
                          type="text"
                          required
                          aria-label="Custom category name"
                          placeholder="New category name"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className={`${inputCls} mt-2 border-[#B9D1BE] bg-[#F6FAF6]`}
                        />
                      )}
                    </div>

                    <div>
                      <label htmlFor="pf-subcategory" className={labelCls}>
                        Subcategory
                      </label>
                      <select
                        id="pf-subcategory"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className={selectCls}
                      >
                        <option value="None">None</option>
                        {COMMON_SUBCATEGORIES.map((sc) => (
                          <option key={sc} value={sc}>
                            {sc}
                          </option>
                        ))}
                        <option value="Custom">+ Custom subcategory…</option>
                      </select>
                      {subcategory === 'Custom' && (
                        <input
                          type="text"
                          aria-label="Custom subcategory name"
                          placeholder="New subcategory name"
                          value={customSubcategory}
                          onChange={(e) => setCustomSubcategory(e.target.value)}
                          className={`${inputCls} mt-2 border-[#B9D1BE] bg-[#F6FAF6]`}
                        />
                      )}
                    </div>
                  </div>
                </fieldset>

                {/* ── Pricing & stock ── */}
                <fieldset className="space-y-4">
                  <legend className={`${sectionTitleCls} mb-3`}>Pricing &amp; stock</legend>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="pf-price" className={labelCls}>
                        Selling price (₹) *
                      </label>
                      <input
                        id="pf-price"
                        type="number"
                        required
                        min={0}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className={`${inputCls} tabular-nums`}
                      />
                    </div>
                    <div>
                      <label htmlFor="pf-original" className={labelCls}>
                        Original price (₹) *
                      </label>
                      <input
                        id="pf-original"
                        type="number"
                        required
                        min={0}
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(Number(e.target.value))}
                        className={`${inputCls} tabular-nums`}
                      />
                      {discountPct > 0 && (
                        <p className="mt-1 text-[12px] font-medium text-emerald-700">
                          Shows a {discountPct}% off badge in the store
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="pf-size" className={labelCls}>
                        Volume / size
                      </label>
                      <input
                        id="pf-size"
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="e.g. 50ml or 100ml"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="pf-stock" className={labelCls}>
                        Stock units *
                      </label>
                      <input
                        id="pf-stock"
                        type="number"
                        required
                        min={0}
                        value={stock}
                        onChange={(e) => setStock(Number(e.target.value))}
                        className={`${inputCls} tabular-nums`}
                      />
                    </div>
                  </div>
                </fieldset>

                {/* ── Photos ── */}
                <fieldset className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <legend className={sectionTitleCls}>Product photos *</legend>
                      <p className={hintCls}>{`Required: add 1 to ${MAX_PRODUCT_IMAGES} of your own product photos (${images.length}/${MAX_PRODUCT_IMAGES}). The first photo is the cover shown in the store. JPG, PNG, WEBP or AVIF, up to 10 MB each.`}</p>
                    </div>
                    {images.length > 0 && images.length < MAX_PRODUCT_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#E2DBD1] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#13382B] transition-colors hover:bg-[#FAF8F5] disabled:opacity-50 ${focusRing}`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Add more
                      </button>
                    )}
                  </div>

                  {/* Hidden multi-file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Upload status */}
                  {uploadingImage && (
                    <div
                      role="status"
                      className="flex items-center gap-2 rounded-xl border border-[#B9D1BE] bg-[#F6FAF6] px-3.5 py-2.5 text-[13px] font-medium text-[#13382B]"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {uploadStatusText || 'Uploading images…'}
                    </div>
                  )}

                  {images.length === 0 ? (
                    /* Empty: large drop zone */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                        isDragging
                          ? 'border-[#13382B] bg-[#EAF1EB]/60'
                          : 'border-[#D9D0C4] bg-[#FAF8F5] hover:border-[#13382B]/60'
                      }`}
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#13382B] shadow-sm">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <p className="text-[14px] font-medium text-stone-800">Drop photos here, or click to browse</p>
                      <p className="mt-1 text-[12px] text-stone-500">You can select several images at once.</p>
                      <button
                        type="button"
                        className={`mt-4 rounded-full bg-[#13382B] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1E4D3B] ${focusRing}`}
                      >
                        Choose images
                      </button>
                    </div>
                  ) : (
                    /* Thumbnails grid */
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`group relative overflow-hidden rounded-2xl border bg-white p-1.5 transition-colors ${
                            idx === 0 ? 'border-[#13382B] ring-2 ring-[#13382B]/15' : 'border-[#EDE8E1] hover:border-[#13382B]/50'
                          }`}
                        >
                          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[#FAF8F5]">
                            <img loading="lazy" decoding="async"
                              src={getImageUrl(imgUrl)}
                              alt={idx === 0 ? 'Cover photo' : `Product photo ${idx + 1}`}
                              onError={() => {
                                console.error('Image load error for:', imgUrl);
                              }}
                              className="h-full w-full object-contain"
                            />
                            {imgUrl.startsWith('blob:') && uploadingImage && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                              </div>
                            )}
                          </div>

                          {idx === 0 ? (
                            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#13382B] px-2 py-0.5 text-[11px] font-medium text-white shadow">
                              <Star className="h-3 w-3 fill-[#C5A880] text-[#C5A880]" />
                              Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              title="Set as cover photo"
                              className={`absolute left-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-stone-700 shadow transition-opacity hover:bg-[#13382B] hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${focusRing}`}
                            >
                              Make cover
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            aria-label={`Remove photo ${idx + 1}`}
                            title="Remove photo"
                            className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-red-600 shadow transition-opacity hover:bg-red-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${focusRing}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add-more tile */}
                      {images.length < MAX_PRODUCT_IMAGES && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-2 text-center transition-colors ${focusRing} ${
                          isDragging ? 'border-[#13382B] bg-[#EAF1EB]/60' : 'border-[#D9D0C4] bg-white hover:border-[#13382B]/60 hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <Plus className="h-5 w-5 text-stone-400 transition-colors group-hover:text-[#13382B]" />
                        <span className="mt-1 text-[12px] font-medium text-stone-600">Add photo</span>
                      </div>
                      )}
                    </div>
                  )}

                  {/* External image URL */}
                  <div className="rounded-2xl bg-[#FAF8F5] p-4">
                    <label htmlFor="pf-image-url" className="mb-1.5 block text-[12px] font-medium text-stone-600">
                      Or add an image from a link
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        id="pf-image-url"
                        type="text"
                        inputMode="url"
                        placeholder="https://… (Google Drive, Dropbox and GitHub links work too)"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          if (imageUrlError) setImageUrlError('');
                        }}
                        onKeyDown={(e) => {
                          // Enter attaches the URL instead of submitting the whole product form
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!checkingImageUrl) handleAddImageUrl();
                          }
                        }}
                        disabled={checkingImageUrl}
                        aria-invalid={Boolean(imageUrlError)}
                        aria-describedby={imageUrlError ? 'pf-image-url-error' : undefined}
                        className={`${inputCls} flex-1 py-2 ${imageUrlError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddImageUrl()}
                        disabled={checkingImageUrl || !imageUrlInput.trim()}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[#E2DBD1] bg-white px-4 py-2 text-[13px] font-medium text-[#13382B] transition-colors hover:bg-[#EDE8E1] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                      >
                        {checkingImageUrl && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {checkingImageUrl ? 'Checking…' : 'Attach image'}
                      </button>
                    </div>
                    {imageUrlError && (
                      <p id="pf-image-url-error" className="mt-2 flex items-start gap-1.5 text-[12px] text-red-600">
                        <AlertCircle className="mt-px h-3.5 w-3.5 flex-shrink-0" />
                        <span>{imageUrlError}</span>
                      </p>
                    )}
                  </div>
                </fieldset>

                {/* ── Formula ── */}
                <fieldset className="space-y-4">
                  <legend className={`${sectionTitleCls} mb-3`}>Formula &amp; usage</legend>

                  <div>
                    <p className={labelCls}>Suitable skin types</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Suitable skin types">
                      {COMMON_SKIN_TYPES.map((st) => {
                        const isSelected = selectedSkinTypes.includes(st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleToggleSkinType(st)}
                            aria-pressed={isSelected}
                            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${focusRing} ${
                              isSelected
                                ? 'border-[#13382B] bg-[#13382B] text-white'
                                : 'border-[#E2DBD1] bg-white text-stone-600 hover:border-[#13382B]/50'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pf-ingredients" className={labelCls}>
                      Key ingredients
                    </label>
                    <input
                      id="pf-ingredients"
                      type="text"
                      placeholder="Botanical Squalane, Marine Micro-Algae, Niacinamide"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      className={inputCls}
                    />
                    <p className={hintCls}>Separate each ingredient with a comma.</p>
                  </div>

                  <div>
                    <label htmlFor="pf-benefits" className={labelCls}>
                      Key benefits
                    </label>
                    <input
                      id="pf-benefits"
                      type="text"
                      placeholder="72-Hour Hydration, Glass Skin Glow, Barrier Repair"
                      value={keyBenefits}
                      onChange={(e) => setKeyBenefits(e.target.value)}
                      className={inputCls}
                    />
                    <p className={hintCls}>Separate each benefit with a comma.</p>
                  </div>

                  <div>
                    <label htmlFor="pf-howto" className={labelCls}>
                      How to use
                    </label>
                    <textarea
                      id="pf-howto"
                      rows={3}
                      placeholder={'Step 1: Cleanse skin thoroughly.\nStep 2: Press 2–3 drops into face and neck.'}
                      value={howToUse}
                      onChange={(e) => setHowToUse(e.target.value)}
                      className={`${inputCls} resize-y leading-relaxed`}
                    />
                    <p className={hintCls}>Write one step per line.</p>
                  </div>
                </fieldset>

                {/* ── Storefront ── */}
                <fieldset className="space-y-4">
                  <legend className={`${sectionTitleCls} mb-3`}>Storefront</legend>

                  <div className="max-w-sm">
                    <label htmlFor="pf-tag" className={labelCls}>
                      Tag badge
                    </label>
                    <select id="pf-tag" value={tag} onChange={(e) => setTag(e.target.value)} className={selectCls}>
                      <option value="None">No tag</option>
                      {COMMON_TAGS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="Custom">+ Custom tag…</option>
                    </select>
                    {tag === 'Custom' && (
                      <input
                        type="text"
                        aria-label="Custom tag"
                        placeholder="e.g. Limited Edition"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        className={`${inputCls} mt-2 border-[#B9D1BE] bg-[#F6FAF6]`}
                      />
                    )}
                    <p className={hintCls}>
                      {tag && tag !== 'None' ? 'Shown on the product card in the store.' : 'No tag will be shown.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      {
                        key: 'active',
                        title: 'Active in store',
                        desc: 'Visible in the store catalogue',
                        checked: isActive,
                        onChange: (v: boolean) => setIsActive(v),
                        on: 'border-[#B9D1BE] bg-[#F6FAF6]',
                      },
                      {
                        key: 'best',
                        title: 'Best Seller',
                        desc: 'Adds a Best Seller badge',
                        checked: isBestSeller,
                        onChange: (v: boolean) => setIsBestSeller(v),
                        on: 'border-[#E3CFA9] bg-[#FBF7EF]',
                      },
                      {
                        key: 'featured',
                        title: 'Top Picks',
                        desc: `Featured on the home page (max ${MAX_FEATURED_PRODUCTS})`,
                        checked: isFeatured,
                        onChange: (v: boolean) => handleFeaturedChange(v),
                        on: 'border-[#D7C9DF] bg-[#F8F5FA]',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-[#13382B]/30 ${
                          opt.checked ? opt.on : 'border-[#EDE8E1] bg-white hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={opt.checked}
                          onChange={(e) => opt.onChange(e.target.checked)}
                          className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-stone-300 accent-[#13382B]"
                        />
                        <span>
                          <span className="flex items-center gap-2 text-[13px] font-semibold text-stone-900">
                            {opt.title}
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                opt.checked ? 'bg-[#13382B] text-white' : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {opt.checked ? 'On' : 'Off'}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[12px] text-stone-500">{opt.desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* Sticky footer */}
              <div className="border-t border-[#EDE8E1] bg-white px-6 py-4 sm:px-8">
                {formError && (
                  <div
                    role="alert"
                    className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700"
                  >
                    <AlertCircle className="mt-px h-4 w-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={`rounded-full border border-[#E2DBD1] px-5 py-2.5 text-[13px] font-medium text-stone-700 transition-colors hover:bg-[#FAF8F5] ${focusRing}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting || uploadingImage}
                    className={`inline-flex items-center gap-2 rounded-full bg-[#13382B] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(19,56,43,0.7)] transition-colors hover:bg-[#1E4D3B] disabled:opacity-50 ${focusRing}`}
                  >
                    {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {formSubmitting ? 'Saving…' : editingProduct ? 'Save changes' : 'Create & publish'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};