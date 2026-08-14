import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X, Star, Zap, Package, Sparkles, ChevronDown, ChevronLeft, ChevronRight, KeyRound, ShieldCheck, Truck, Gem, Medal, Users, User, LogOut, Globe, Heart, Home, Search } from 'lucide-react';
import CollectionPage from './CollectionPage';
import ProductCard from './ProductCard';
import ImageWithFallback, { getPrimaryImageUrl } from './imageUtils';

export const CATEGORIES = [
  { key: 'anime-figures', label: 'Anime Figures', backend: '1. anime figures' },
  { key: 'key-chains', label: 'Key Chains', backend: '2. key chains' },
  { key: 'mouse-pads', label: 'Mouse Pads', backend: '3. mouse pads' },
  { key: 'stationary', label: 'Stationary', backend: '4. stationary' },
  { key: 'cosplay-accessories', label: 'Cosplay Accessories', backend: '5. cosplay accessories' },
  { key: 'apparel', label: 'Apparel', backend: '6. appearl' },
  { key: 'manga', label: 'Manga', backend: '7. manga' },
  { key: 'bagpacks', label: 'Bagpacks', backend: '8. bagpacks' },
  { key: 'cups', label: 'Cups', backend: '9. cups' },
  { key: 'phone-cases', label: 'Phone Cases', backend: '10. phone cases' },
  { key: 'magnets', label: 'Magnets', backend: '11. magnets' },
  { key: 'mystery-collection', label: 'Mystery Collection', backend: '12. mystry collection' },
  { key: 'combos', label: 'Combos', backend: '13. combos' },
];

const EMPTY_PRODUCTS = CATEGORIES.reduce((acc, cat) => {
  acc[cat.key] = [];
  return acc;
}, {});

const ORDERS_API_URL = 'https://script.google.com/macros/s/AKfycbxu4FUgd5vYzqhhdJH7s-0anQ6pHyfysrRFm3hC_NsSFHmYLlSfJkLLo-e_k1-zOrakwA/exec';

// Cloudflare D1 API (Pages Functions — relative URL works in production + preview)
const D1_API = '/api';

const resolveImageUrl = (rawValue) => getPrimaryImageUrl(rawValue, '/placeholder.svg');

const getImageField = (rawProduct) => {
  if (!rawProduct || typeof rawProduct !== 'object') return '';
  const explicit = rawProduct.image || rawProduct.Image || rawProduct.image_url || rawProduct.img || rawProduct.thumbnail || rawProduct['image link'];
  if (explicit) return explicit;
  const key = Object.keys(rawProduct).find(k => /image|img|thumbnail/i.test(k));
  return key ? rawProduct[key] : '';
};

const collectProductGallery = (rawProduct) => {
  const seen = new Set();
  const addEntry = (value, label = 'View') => {
    if (!value && value !== 0) return;
    const normalized = typeof value === 'string' ? value.trim() : value?.url || value?.src || value?.value || value?.text || '';
    if (typeof normalized !== 'string') return;
    const clean = normalized.trim();
    if (!clean) return;
    const resolved = resolveImageUrl(clean);
    if (seen.has(resolved)) return;
    seen.add(resolved);
    return { url: resolved, label };
  };

  const gallery = [];
  const push = (value, label) => {
    const entry = addEntry(value, label);
    if (entry) gallery.push(entry);
  };

  const directList = rawProduct?.images || rawProduct?.imageUrls || rawProduct?.image_gallery || rawProduct?.gallery || rawProduct?.imageURLs;
  if (Array.isArray(directList)) {
    directList.forEach(item => push(item, 'View'));
  } else if (typeof directList === 'string') {
    directList.split(/\||\n|;/).map(item => item.trim()).filter(Boolean).forEach(item => push(item, 'View'));
  }

  const orderedFields = [
    ['front', 'Front'],
    ['frontImage', 'Front'],
    ['front_image', 'Front'],
    ['frontView', 'Front'],
    ['side', 'Side'],
    ['sideImage', 'Side'],
    ['side_image', 'Side'],
    ['sideView', 'Side'],
    ['back', 'Back'],
    ['backImage', 'Back'],
    ['back_image', 'Back'],
    ['backView', 'Back'],
    ['top', 'Top'],
    ['topImage', 'Top'],
    ['top_image', 'Top'],
    ['topView', 'Top'],
    ['image', 'Main'],
    ['image_url', 'Main'],
    ['img', 'Main'],
    ['thumbnail', 'Main'],
    ['photo', 'Main'],
    ['image1', '1'],
    ['image 1', '1'],
    ['image2', '2'],
    ['image 2', '2'],
    ['image3', '3'],
    ['image 3', '3'],
    ['image4', '4'],
    ['image 4', '4'],
    ['image5', '5'],
    ['image 5', '5'],
    ['image6', '6'],
    ['image 6', '6'],
    ['image7', '7'],
    ['image 7', '7'],
    ['image8', '8'],
    ['image 8', '8'],
  ];

  orderedFields.forEach(([key, label]) => push(rawProduct?.[key], label));

  const extraKeys = Object.keys(rawProduct || {})
    .filter(k => !orderedFields.some(([key]) => key.toLowerCase() === k.toLowerCase()))
    .filter(k => /(?:image|img|thumbnail|photo|front|side|back|top)/i.test(k));

  extraKeys.sort((a, b) => {
    const order = ['front', 'side', 'back', 'top', 'image', 'img', 'thumbnail', 'photo'];
    const aKey = a.toLowerCase();
    const bKey = b.toLowerCase();
    const aIndex = order.findIndex(pattern => aKey.includes(pattern));
    const bIndex = order.findIndex(pattern => bKey.includes(pattern));
    if (aIndex !== bIndex) return aIndex - bIndex;
    return aKey.localeCompare(bKey, undefined, { numeric: true });
  });

  extraKeys.forEach((key) => {
    const label = key.replace(/_/g, ' ').replace(/image/i, '').trim() || 'View';
    push(rawProduct[key], label.charAt(0).toUpperCase() + label.slice(1));
  });

  return gallery.length > 0 ? gallery : [{ url: resolveImageUrl(getImageField(rawProduct)), label: 'Main' }];
};

function parseNumeric(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const parsed = Number(String(value).replace(/[^\d.-]+/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getFieldCaseInsensitive(obj, ...names) {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = Object.keys(obj);
  for (const name of names) {
    const target = name.toLowerCase().replace(/[\s_-]+/g, '');
    const foundKey = keys.find(k => k.toLowerCase().replace(/[\s_-]+/g, '') === target);
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && String(obj[foundKey]).trim() !== '') {
      return obj[foundKey];
    }
  }
  return undefined;
}

function normalizeProduct(rawProduct, fallbackIndex = 0) {
  const title = String(rawProduct?.title || rawProduct?.name || 'Unnamed product').trim();
  const subtitle = String(rawProduct?.subtitle || rawProduct?.description || '').trim();
  const price = parseNumeric(getFieldCaseInsensitive(rawProduct, 'price', 'currentPrice', 'sellingPrice') ?? rawProduct?.price);
  const explicitActual = parseNumeric(getFieldCaseInsensitive(rawProduct, 'actualPrice', 'actual_price', 'mrp', 'originalPrice', 'listPrice', 'maxRetailPrice') ?? rawProduct?.actualPrice);
  const explicitDiscount = parseNumeric(getFieldCaseInsensitive(rawProduct, 'discount', 'discountPercent', 'percentOff', 'off') ?? rawProduct?.discount);

  // Compute discount percent and actual (original/MRP) price robustly:
  // - If an explicit discount percent exists, use it to derive actual price when missing.
  // - If an explicit actual price exists, compute discount percent from it.
  // - Fallback: no discount.
  let discountPercent = 0;
  let actualPrice = explicitActual || 0;

  if (explicitDiscount > 0) {
    discountPercent = Math.round(explicitDiscount);
    if (!actualPrice || actualPrice <= price) {
      const denom = 1 - (discountPercent / 100);
      actualPrice = denom > 0 ? Math.round(price / denom) : price;
    }
  } else if (explicitActual > 0 && explicitActual > price) {
    actualPrice = explicitActual;
    discountPercent = Math.round(((actualPrice - price) / actualPrice) * 100);
  } else {
    if (price > 0) {
      const defaultDiscount = 25;
      const calculatedActual = Math.ceil((price / (1 - defaultDiscount / 100)) / 10) * 10 - 1;
      actualPrice = Math.max(calculatedActual, price + 50);
      discountPercent = Math.round(((actualPrice - price) / actualPrice) * 100);
    } else {
      actualPrice = price;
      discountPercent = 0;
    }
  }
  const rating = Number(rawProduct?.rating) || 4.5;
  const reviews = Number(rawProduct?.reviews || rawProduct?.review) || 0;
  const scale = String(rawProduct?.scale || rawProduct?.size || 'Standard').trim();
  const stockQuantity = Number(rawProduct?.stockQuantity ?? rawProduct?.stock ?? 0);
  const inStock = rawProduct?.inStock !== undefined
    ? String(rawProduct?.inStock).toLowerCase() === 'yes' || rawProduct?.inStock === true
    : stockQuantity > 0;

  const addedDateStr = rawProduct?.date || rawProduct?.['added date'] || rawProduct?.added_date || rawProduct?.['upload date'] || rawProduct?.upload_date || rawProduct?.created_at;
  const addedDate = addedDateStr ? new Date(addedDateStr) : null;
  const isNew = addedDate && !isNaN(addedDate) && (new Date() - addedDate) <= 3 * 24 * 60 * 60 * 1000 && (new Date() - addedDate) >= 0;

  let badge = String(rawProduct?.badge || '').trim();
  let badgeColor = String(rawProduct?.badgeColor || '').trim();

  if (isNew) {
    badge = 'NEW';
    badgeColor = '#ef4444';
  } else if (badge.toUpperCase() === 'NEW' && !isNew) {
    badge = stockQuantity > 0 && stockQuantity < 5 ? 'Rare Available' : (inStock ? '' : 'Sold Out');
    badgeColor = stockQuantity > 0 && stockQuantity < 5 ? '#f59e0b' : (inStock ? '' : '#666666');
  } else if (!badge) {
    badge = stockQuantity > 0 && stockQuantity < 5 ? 'Rare Available' : (inStock ? '' : 'Sold Out');
    badgeColor = stockQuantity > 0 && stockQuantity < 5 ? '#f59e0b' : (inStock ? '' : '#666666');
  }
  const galleryImages = collectProductGallery(rawProduct);
  const image = galleryImages[0]?.url || resolveImageUrl(getImageField(rawProduct));
  const features = Array.isArray(rawProduct?.features)
    ? rawProduct.features.map(String)
    : typeof rawProduct?.features === 'string'
      ? rawProduct.features.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  const categoryId = Number(rawProduct?.category_id || rawProduct?.categoryId || 0);
  let matchedCategory = null;
  if (categoryId >= 1 && categoryId <= 13) {
    matchedCategory = CATEGORIES[categoryId - 1];
  } else {
    const rawCat = String(rawProduct?.category || '').trim().toLowerCase();
    matchedCategory = CATEGORIES.find(c => {
      const backendClean = c.backend.toLowerCase().trim();
      const backendNameOnly = backendClean.replace(/^\d+\.\s*/, '').trim();
      const cleanRawCat = rawCat.replace(/\s+/g, ' ');
      const cleanBackendClean = backendClean.replace(/\s+/g, ' ');
      const cleanBackendNameOnly = backendNameOnly.replace(/\s+/g, ' ');
      return cleanRawCat === cleanBackendClean || cleanRawCat === cleanBackendNameOnly || cleanRawCat.includes(cleanBackendNameOnly);
    });
  }

  const categoryKey = matchedCategory ? matchedCategory.key : 'anime-figures';
  const categoryName = matchedCategory ? matchedCategory.label : 'Anime Figures';

  return {
    id: Number(rawProduct?.id) || fallbackIndex + 1,
    name: title,
    title,
    subtitle,
    scale,
    price,
    actualPrice,
    discountPercent,
    rating,
    reviews,
    review: reviews,
    badge,
    badgeColor,
    isNew,
    image,
    galleryImages,
    stockQuantity,
    inStock,
    features,
    category: categoryKey,
    categoryId: categoryId || 1,
    categoryName,
  };
}

function buildProductsByCategory(rawProducts = []) {
  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = [];
    return acc;
  }, {});

  rawProducts.forEach((product, index) => {
    const normalized = normalizeProduct(product, index);
    if (grouped[normalized.category]) {
      grouped[normalized.category].push(normalized);
    } else {
      if (!grouped['anime-figures']) {
        grouped['anime-figures'] = [];
      }
      grouped['anime-figures'].push(normalized);
    }
  });

  return grouped;
}


// ─── Wishlist Sidebar ─────────────────────────────────────────────────────────
function WishlistSidebar({ wishlist, onClose, onAdd, onToggleWishlist }) {
  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <aside className="cart-sidebar">
        <div className="cart-header">
          <h2>My Wishlist ({wishlist.length})</h2>
          <button className="cart-close" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="cart-items">
          {wishlist.length === 0 ? (
            <div className="empty-cart">
              <Heart size={48} color="#cbd5e1" strokeWidth={1} style={{ marginBottom: '1rem' }} />
              <p>Your wishlist is empty.</p>
              <button className="btn-continue" onClick={onClose} style={{ marginTop: '1rem', width: 'auto', padding: '0.75rem 2rem' }}>Explore Products</button>
            </div>
          ) : (
            wishlist.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img-box">
                  <ImageWithFallback src={item.image} alt={item.title} className="cart-item-img" />
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-title-row">
                    <h4>{item.title}</h4>
                    <button className="btn-remove" onClick={() => onToggleWishlist(item)} title="Remove">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="cart-item-price">₹{item.price.toLocaleString('en-IN')}</div>
                  <div className="cart-qty-row" style={{ marginTop: '0.75rem' }}>
                    <button 
                      className="btn-checkout" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', minHeight: 'auto' }}
                      onClick={() => { onAdd(item); onClose(); }}
                    >
                      <ShoppingCart size={14} style={{ marginRight: '4px', display: 'inline' }} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Cart Sidebar & Checkout ──────────────────────────────────────────────────
function CartSidebar({ cart, onClose, onRemove, onUpdateQty, onPlaceOrder, user, setUser, onOpenAccount }) {
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [customNote, setCustomNote] = useState('');
  const [country, setCountry] = useState('India');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [saveInfo, setSaveInfo] = useState(true);
  const [textOffers, setTextOffers] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  // Auto-fill from user profile when logged in
  useEffect(() => {
    if (user) {
      if (user.name) {
        const parts = user.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || parts[0] || '');
      }
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(String(user.phone).replace(/\D/g, '').slice(-10));
      if (user.address) setAddress(user.address);
      if (user.city) setCity(user.city);
      if (user.state) setState(user.state);
      if (user.pincode) setPincode(user.pincode);
    }
  }, [user]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const FREE_SHIPPING_THRESHOLD = 999;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = isFreeShipping ? 0 : 79;
  const grandTotal = subtotal + shippingFee;
  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!lastName || !email || cleanPhone.length < 10 || !address || !city || !pincode) return;

    const formattedPhone = `+91 ${cleanPhone}`;
    const fullName = `${firstName} ${lastName}`.trim() || lastName;
    const fullAddress = `${address}${apartment ? ', ' + apartment : ''}, ${city}, ${state} - ${pincode}, ${country}`;
    const orderNum = 'ACK-' + Math.floor(100000 + Math.random() * 900000);
    setCreatedOrderId(orderNum);

    // Save shipping details to logged-in profile if saveInfo checked
    if (saveInfo && user) {
      const updatedUser = {
        ...user,
        name: fullName,
        email: email,
        phone: cleanPhone,
        address: address,
        city: city,
        state: state,
        pincode: pincode
      };
      setUser?.(updatedUser);
      localStorage.setItem('animecurio_current_user', JSON.stringify(updatedUser));

      try {
        const dbUsers = JSON.parse(localStorage.getItem('animecurio_d1_users') || '[]');
        const idx = dbUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (idx !== -1) {
          dbUsers[idx] = updatedUser;
        } else {
          dbUsers.push(updatedUser);
        }
        localStorage.setItem('animecurio_d1_users', JSON.stringify(dbUsers));
      } catch (err) {}
      
      if (typeof D1_API !== 'undefined') {
        fetch(`${D1_API}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', email: email, name: fullName, phone: cleanPhone, address, city, state, pincode })
        }).catch(() => {});
      }
    }

    const itemsSummary = cart
      .map((item, idx) => `${idx + 1}. ${item.title} x ${item.qty} - ₹${(item.price * item.qty).toLocaleString('en-IN')}`)
      .join('; ');

    const itemsSummaryFormatted = cart
      .map((item, idx) => `${idx + 1}. ${item.title} x ${item.qty} - ₹${(item.price * item.qty).toLocaleString('en-IN')}`)
      .join('\n');

    const msg = `🛒 *New Order from AnimeCurio*\n` +
      `📋 *Confirmation ID:* ${orderNum}\n\n` +
      `👤 *Customer:* ${fullName}\n` +
      `📧 *Gmail:* ${email}\n` +
      `📞 *WhatsApp:* ${formattedPhone}\n` +
      (company ? `🏢 *Business:* ${company}\n` : '') +
      `🏙️ *City:* ${city}\n` +
      `📍 *Address:* ${fullAddress}\n` +
      (customNote.trim() ? `📝 *Custom Note:* ${customNote.trim()}\n` : '') +
      `💳 *Payment:* Send Payment QR Code to Gmail (${email}) & WhatsApp (${formattedPhone})\n\n` +
      `📦 *Items:* \n${itemsSummaryFormatted}\n\n` +
      `💵 *Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n` +
      `🚚 *Shipping Charges:* ${isFreeShipping ? 'FREE (Orders ₹999+)' : '₹79'}\n` +
      `💰 *Total Amount:* ₹${grandTotal.toLocaleString('en-IN')}`;

    const newOrder = {
      id: orderNum,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, qty: i.qty, image: i.image })),
      total: grandTotal,
      subtotal: subtotal,
      shippingFee: shippingFee,
      name: fullName,
      email: email,
      phone: formattedPhone,
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      status: 'Payment Pending (QR Sent)'
    };

    // Save order to localStorage keyed by user email so it persists in Order History
    try {
      const storageKey = `animecurio_orders_${email.toLowerCase()}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedOrders = [newOrder, ...existing];
      localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
      // Also save to generic key for backward compat
      localStorage.setItem('animecurio_orders', JSON.stringify(updatedOrders));
    } catch (storageErr) {}

    onPlaceOrder?.(newOrder);

    // Post Order payload to Google Sheets Orders tab & trigger Google Apps Script email
    if (ORDERS_API_URL) {
      try {
        fetch(ORDERS_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            orderId: orderNum,
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            name: fullName,
            whatsapp: formattedPhone,
            email: email,
            business: company,
            address: address,
            city: city,
            state: state,
            pincode: pincode,
            orderItems: itemsSummary,
            customNote: customNote.trim() || '',
            orderTotal: `₹${grandTotal.toLocaleString('en-IN')} (${isFreeShipping ? 'FREE Shipping' : 'incl. ₹79 shipping'})`,
            status: 'Payment Pending (QR Sent)'
          })
        }).catch(err => console.log('Google Sheets Order sync note:', err));
      } catch (err) {}
    }

    setStep('success');

    // Delay WhatsApp redirect to ensure network requests dispatch first
    setTimeout(() => {
      try {
        window.open(`https://wa.me/918360048865?text=${encodeURIComponent(msg)}`, '_blank');
      } catch (err) {}
    }, 600);
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <aside className="cart-sidebar">
        <div className="cart-header">
          <h2 className="cart-title">{step === 'checkout' ? 'Shipping Address' : step === 'success' ? 'Order Confirmed' : 'Your Cart'}</h2>
          <button className="cart-close" onClick={onClose}><X size={20} /></button>
        </div>

        {step === 'success' ? (
          <div className="cart-success">
            <Sparkles size={48} color="#16a34a" />
            <h3>Order Received Successfully!</h3>
            <div className="confirmation-badge" style={{ background: 'var(--maroon-pale)', padding: '0.75rem 1.25rem', borderRadius: '12px', margin: '0.5rem 0', fontWeight: 'bold', color: 'var(--maroon)', fontSize: '0.95rem', textAlign: 'center' }}>
              <div>Confirmation ID: {createdOrderId}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '0.25rem', fontWeight: 600 }}>
                Real-Time Tracking ID: TRACK-{createdOrderId}
              </div>
            </div>

            <div className="trust-notice-box" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '14px', margin: '1rem 0', textAlign: 'left', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={20} color="#16a34a" /> 100% Secure Order & Payment Process
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--text)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                For your complete trust and safety, we send your <strong>Payment QR Code</strong> and <strong>Invoice</strong> directly to your official email and WhatsApp line:
              </p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <li>📧 <strong>Gmail:</strong> {email}</li>
                <li>💬 <strong>WhatsApp:</strong> {phone}</li>
              </ul>
              <p style={{ fontSize: '0.8rem', color: '#16a34a', margin: '0.5rem 0 0 0', fontWeight: 600 }}>
                ✓ Please check your Gmail inbox / WhatsApp to view payment details and track order live.
              </p>
            </div>

            <button className="btn-primary" onClick={onClose} style={{ marginTop: '0.5rem', width: '100%' }}>Continue Shopping</button>
          </div>
        ) : cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={48} strokeWidth={1} />
            <p>Your cart is empty</p>
            <span>Add some amazing merch!</span>
          </div>
        ) : step === 'cart' ? (
          <>
            <div className="shipping-progress-banner" style={{ background: isFreeShipping ? '#f0fdf4' : '#fff5f6', border: `1px solid ${isFreeShipping ? '#86efac' : '#fecdd3'}`, padding: '0.65rem 0.85rem', borderRadius: '12px', margin: '0.5rem 1rem 0.25rem', fontSize: '0.82rem', color: isFreeShipping ? '#166534' : 'var(--maroon)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Truck size={18} color={isFreeShipping ? '#16a34a' : 'var(--maroon)'} />
              {isFreeShipping ? (
                <span>🎉 Congratulations! You unlocked <strong>FREE Shipping</strong> (Saved ₹79)!</span>
              ) : (
                <span>Add <strong>₹{amountForFreeShipping.toLocaleString('en-IN')}</strong> more to unlock <strong>FREE Shipping</strong> (Orders ₹999+)!</span>
              )}
            </div>

            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img-box">
                    <ImageWithFallback src={item.image} alt={item.title} className="cart-item-img" />
                  </div>
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.title}</p>
                    <div className="cart-item-price-group">
                      <span className="cart-item-price"><span className="currency-symbol">₹</span>{item.price.toLocaleString('en-IN')}</span>
                      {item.actualPrice > item.price && (
                        <span className="product-mrp-group">
                          <span className="product-mrp-label">M.R.P:</span>
                          <span className="cart-item-price-old">₹{item.actualPrice.toLocaleString('en-IN')}</span>
                          {item.discountPercent > 0 && <span className="cart-item-discount">({item.discountPercent}% off)</span>}
                        </span>
                      )}
                    </div>
                    <div className="cart-item-controls">
                      <button onClick={() => onUpdateQty(item.id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() => onUpdateQty(item.id, 1)}
                        disabled={item.qty >= (item.stockQuantity ?? item.stock ?? 10)}
                      >+
                      </button>
                    </div>
                  </div>
                  <button className="cart-item-remove" onClick={() => onRemove(item.id)}><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total-breakdown" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Shipping Charges</span>
                  <span style={{ color: isFreeShipping ? '#16a34a' : 'var(--text)', fontWeight: isFreeShipping ? 600 : 'normal' }}>
                    {isFreeShipping ? 'FREE (Waved Off 🎉)' : '₹79'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text)', borderTop: '1px solid var(--bg3)', paddingTop: '0.35rem' }}>
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              {user ? (
                <button className="btn-checkout" onClick={() => setStep('checkout')}>Proceed to Checkout →</button>
              ) : (
                <div style={{ width: '100%' }}>
                  <div style={{ background: '#fff5f6', border: '1px solid #fecdd3', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--maroon)', marginBottom: '0.3rem' }}>🔐 Sign in to Place Your Order</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Create an account for order tracking & fast checkout</div>
                  </div>
                  <button className="btn-checkout" onClick={() => { onClose(); onOpenAccount?.(); }}>Sign In / Create Account →</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmitOrder} className="checkout-form">
            <button type="button" className="btn-back-cart" onClick={() => setStep('cart')}>
              ← Back to Cart Items
            </button>

            <div className="shipping-progress-banner" style={{ background: isFreeShipping ? '#f0fdf4' : '#fff5f6', border: `1px solid ${isFreeShipping ? '#86efac' : '#fecdd3'}`, padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.8rem', color: isFreeShipping ? '#166534' : 'var(--maroon)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <Truck size={16} color={isFreeShipping ? '#16a34a' : 'var(--maroon)'} />
              {isFreeShipping ? '🎉 FREE Shipping Unlocked!' : `Add ₹${amountForFreeShipping} more for FREE Shipping`}
            </div>

            <div className="form-group">
              <label>Country/Region</label>
              <select value={country} onChange={e => setCountry(e.target.value)}>
                <option value="India">India</option>
              </select>
            </div>

            <div className="form-row two-col">
              <div className="form-group">
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name (optional)" />
              </div>
              <div className="form-group">
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name *" />
              </div>
            </div>

            <div className="form-group">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Gmail / Email Address *" />
            </div>

            <div className="form-group">
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company (optional)" />
            </div>

            <div className="form-group">
              <input type="text" required value={address} onChange={e => setAddress(e.target.value)} placeholder="Address *" />
            </div>

            <div className="form-group">
              <input type="text" value={apartment} onChange={e => setApartment(e.target.value)} placeholder="Apartment, suite, etc. (optional)" />
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="City *" />
              </div>
              <div className="form-group">
                <select value={state} onChange={e => setState(e.target.value)}>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Puducherry">Puducherry</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>
              <div className="form-group">
                <input type="text" required value={pincode} onChange={e => setPincode(e.target.value)} placeholder="PIN code *" />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', fontWeight: 600 }}>WhatsApp Mobile Number *</label>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ background: 'var(--bg2)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--bg3)', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--maroon)' }}>
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="checkbox-group">
              <label className="form-checkbox">
                <input type="checkbox" checked={saveInfo} onChange={e => setSaveInfo(e.target.checked)} />
                <span>Save this information for next time</span>
              </label>
              <label className="form-checkbox">
                <input type="checkbox" checked={textOffers} onChange={e => setTextOffers(e.target.checked)} />
                <span>Text me with news and offers</span>
              </label>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', fontWeight: 600 }}>📝 Custom Note (optional)</label>
              <textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Any special instructions, gift message, or customization request..."
                rows={3}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid var(--bg3)', background: '#ffffff', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: 'var(--text)', resize: 'vertical', transition: 'border-color 0.2s' }}
              />
            </div>

            <div className="payment-qr-notice" style={{ background: 'var(--maroon-pale)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--maroon)' }}>
              <strong>💳 Payment via QR Code:</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text)' }}>
                We will send the payment QR code directly to your Gmail and WhatsApp.
              </p>
            </div>

            <div className="cart-footer">
              <div className="cart-total-breakdown" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Shipping Charges</span>
                  <span style={{ color: isFreeShipping ? '#16a34a' : 'var(--text)', fontWeight: isFreeShipping ? 600 : 'normal' }}>
                    {isFreeShipping ? 'FREE (Waved Off 🎉)' : '₹79'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text)', borderTop: '1px solid var(--bg3)', paddingTop: '0.35rem' }}>
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <button type="submit" className="btn-checkout whatsapp-checkout">
                Place Order & Get Payment QR →
              </button>
            </div>
          </form>
        )}
      </aside>
    </>
  );
}

// ─── Account / Profile & Order History Modal ──────────────────────────────────
function AccountModal({ onClose, user, setUser, orders = [] }) {
  const [authMode, setAuthMode] = useState(user?.email ? 'profile' : 'signin'); // 'signin' | 'signup' | 'forgot' | 'profile'
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPincode, setRegPincode] = useState('');

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone ? String(user.phone).replace(/\D/g, '').slice(-10) : '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [saved, setSaved] = useState(false);

  // Sync edit state when user prop changes
  useEffect(() => {
    if (user?.email) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone ? String(user.phone).replace(/\D/g, '').slice(-10) : '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setState(user.state || '');
      setPincode(user.pincode || '');
      setAuthMode('profile');
    }
  }, [user]);

  // ─── Handle Sign In via D1 ────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${D1_API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail.trim(), password: loginPassword })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('animecurio_current_user', JSON.stringify(data.user));
        setAuthMode('profile');
      } else {
        setLoginError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      // Fallback to localStorage if D1 API is unreachable
      try {
        const dbUsers = JSON.parse(localStorage.getItem('animecurio_d1_users') || '[]');
        const found = dbUsers.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase() && u.password === loginPassword);
        if (found) {
          setUser(found); localStorage.setItem('animecurio_current_user', JSON.stringify(found)); setAuthMode('profile');
        } else { setLoginError('Invalid email or password'); }
      } catch (e) { setLoginError('Login failed. Please try again.'); }
    } finally { setAuthLoading(false); }
  };

  // ─── Handle Forgot Password ───────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setRecoveredPassword('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${D1_API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot', email: forgotEmail.trim() })
      });
      const data = await res.json();
      setForgotMsg(data.success ? '✓ If this email is registered, a reset message will be sent on WhatsApp.' : (data.error || 'Email not found.'));
    } catch (err) {
      setForgotMsg('✓ If this email is registered, you will be contacted on WhatsApp.');
    } finally { setAuthLoading(false); }
  };

  // ─── Handle Sign Up via D1 ────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
    if (!regName || !regEmail || !regPassword || cleanPhone.length < 10) return;
    setAuthLoading(true);

    const newUser = {
      id: 'U-' + Date.now(),
      name: regName,
      email: regEmail.trim().toLowerCase(),
      phone: `+91 ${cleanPhone}`,
      address: regAddress,
      city: regCity,
      state: regState,
      pincode: regPincode,
      password: regPassword,
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`${D1_API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...newUser })
      });
      const data = await res.json();
      if (!data.success) {
        setLoginError(data.error || 'Registration failed');
        setAuthLoading(false); return;
      }
    } catch (err) {
      // Fallback: save to localStorage if D1 unreachable
    }

    // Always save to localStorage cache
    try {
      const dbUsers = JSON.parse(localStorage.getItem('animecurio_d1_users') || '[]');
      const updatedDb = dbUsers.filter(u => u.email.toLowerCase() !== newUser.email);
      updatedDb.push(newUser);
      localStorage.setItem('animecurio_d1_users', JSON.stringify(updatedDb));
    } catch (err) {}

    setUser(newUser);
    localStorage.setItem('animecurio_current_user', JSON.stringify(newUser));
    setAuthMode('profile');
    setAuthLoading(false);
  };

  // ─── Handle Save Profile via D1 ───────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const updated = { ...user, name, email: email.trim(), phone: `+91 ${cleanPhone}`, address, city, state, pincode };
    setUser(updated);
    localStorage.setItem('animecurio_current_user', JSON.stringify(updated));

    try {
      await fetch(`${D1_API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', email: updated.email, name: updated.name, phone: cleanPhone, address: updated.address, city: updated.city, state: updated.state, pincode: updated.pincode })
      });
    } catch (err) {}

    // Update localStorage cache too
    try {
      const dbUsers = JSON.parse(localStorage.getItem('animecurio_d1_users') || '[]');
      const idx = dbUsers.findIndex(u => u.email.toLowerCase() === (user?.email || '').toLowerCase());
      if (idx !== -1) dbUsers[idx] = updated; else dbUsers.push(updated);
      localStorage.setItem('animecurio_d1_users', JSON.stringify(dbUsers));
    } catch (err) {}

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Handle Sign Out
  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('animecurio_current_user');
    setAuthMode('signin');
  };

  // Filter orders for current logged-in user — reads from both generic + email-keyed storage
  const userEmailLower = (user?.email || '').trim().toLowerCase();
  const userOrders = React.useMemo(() => {
    if (!userEmailLower) return orders;
    // Read from email-specific key (most reliable)
    try {
      const userKey = `animecurio_orders_${userEmailLower}`;
      const stored = JSON.parse(localStorage.getItem(userKey) || '[]');
      if (stored.length > 0) return stored;
    } catch (e) {}
    // Fallback: filter from generic orders prop
    return orders.filter(o => (o.email || '').trim().toLowerCase() === userEmailLower);
  }, [userEmailLower, orders]);

  return (
    <div className="account-modal-overlay" onClick={onClose}>
      <div className="account-modal" onClick={e => e.stopPropagation()}>
        <button className="account-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="account-modal-header">
          <h2>{authMode === 'profile' ? 'My Account' : authMode === 'signup' ? 'Create Account' : authMode === 'forgot' ? 'Reset Password' : 'Sign In'}</h2>
          <p>{authMode === 'profile' ? 'Manage your saved shipping details & track past orders' : authMode === 'signup' ? 'Create your profile for fast checkout & order tracking' : authMode === 'forgot' ? 'Recover your account details' : 'Access your profile and order history'}</p>
        </div>

        {authMode === 'signin' ? (
          <div className="account-modal-body">
            {loginError && <div className="auth-error-badge">{loginError}</div>}
            <form onSubmit={handleSignIn} className="account-form">
              <div className="form-group">
                <label>Email / Gmail Address *</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="e.g. yoshika@gmail.com"
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: '-0.25rem', marginBottom: '0.75rem' }}>
                <button type="button" className="auth-forgot-link" onClick={() => setAuthMode('forgot')}>
                  Forgot Password?
                </button>
              </div>
              <button type="submit" className="btn-primary full-width">
                Sign In to Account
              </button>
            </form>
            <div className="auth-switch-box">
              <span>New collector on AnimeCurio?</span>
              <button className="auth-switch-btn" onClick={() => setAuthMode('signup')}>
                Create Account
              </button>
            </div>
          </div>
        ) : authMode === 'forgot' ? (
          <div className="account-modal-body">
            {forgotMsg && <div className="auth-info-badge">{forgotMsg}</div>}
            {recoveredPassword ? (
              <div className="password-recovered-box" style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '1rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ color: '#166534', fontWeight: 'bold', fontSize: '0.9rem' }}>Account Credentials Recovered</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#15803d' }}>
                  Your password is: <strong style={{ fontSize: '1rem', background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #bbf7d0' }}>{recoveredPassword}</strong>
                </div>
                <button
                  className="btn-primary"
                  style={{ marginTop: '0.85rem', width: '100%' }}
                  onClick={() => {
                    setLoginEmail(forgotEmail);
                    setLoginPassword(recoveredPassword);
                    setAuthMode('signin');
                  }}
                >
                  Proceed to Sign In →
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="account-form">
                <div className="form-group">
                  <label>Your Registered Gmail Address *</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="e.g. yoshika@gmail.com"
                  />
                </div>
                <button type="submit" className="btn-primary full-width" style={{ marginTop: '0.5rem' }}>
                  Recover Account
                </button>
              </form>
            )}
            <div className="auth-switch-box">
              <span>Remembered your password?</span>
              <button className="auth-switch-btn" onClick={() => setAuthMode('signin')}>
                Back to Sign In
              </button>
            </div>
          </div>
        ) : authMode === 'signup' ? (
          <div className="account-modal-body">
            <form onSubmit={handleSignUp} className="account-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Yoshika"
                />
              </div>
              <div className="form-group">
                <label>Gmail / Email Address *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="e.g. yoshika@gmail.com"
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', fontWeight: 600 }}>WhatsApp Phone *</label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ background: 'var(--bg2)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--bg3)', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--maroon)' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Create Password *</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Create a secure password"
                />
              </div>
              <div className="form-group">
                <label>Shipping Address (optional)</label>
                <textarea
                  rows={2}
                  value={regAddress}
                  onChange={e => setRegAddress(e.target.value)}
                  placeholder="Default delivery address"
                />
              </div>
              <div className="form-row three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div className="form-group">
                  <input type="text" value={regCity} onChange={e => setRegCity(e.target.value)} placeholder="City" />
                </div>
                <div className="form-group">
                  <input type="text" value={regState} onChange={e => setRegState(e.target.value)} placeholder="State" />
                </div>
                <div className="form-group">
                  <input type="text" value={regPincode} onChange={e => setRegPincode(e.target.value)} placeholder="PIN code" />
                </div>
              </div>
              <button type="submit" className="btn-primary full-width" style={{ marginTop: '0.5rem' }}>
                Create Account & Save Profile
              </button>
            </form>
            <div className="auth-switch-box">
              <span>Already have an account?</span>
              <button className="auth-switch-btn" onClick={() => setAuthMode('signin')}>
                Sign In
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={16} /> Details
              </button>
              <button
                className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <Package size={16} /> Order History ({userOrders.length})
              </button>
              <button className="profile-tab tab-signout" onClick={handleSignOut} style={{ marginLeft: 'auto', color: '#ef4444' }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
            <div className="account-modal-body">
              {activeTab === 'profile' ? (
                <form onSubmit={handleSaveProfile} className="account-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yoshika" required />
                  </div>
                  <div className="form-group">
                    <label>Email / Gmail Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. yoshika@gmail.com" required />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', fontWeight: 600 }}>WhatsApp Phone</label>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ background: 'var(--bg2)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--bg3)', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--maroon)' }}>
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Saved Shipping Address</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full address for fast checkout..." rows={3} />
                  </div>
                  <div className="form-row three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginTop: '-0.2rem' }}>
                    <div className="form-group">
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
                    </div>
                    <div className="form-group">
                      <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="State" />
                    </div>
                    <div className="form-group">
                      <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="PIN code" />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary full-width">
                    {saved ? '✓ Profile Saved to Cloud' : 'Save Profile Details'}
                  </button>
                </form>
              ) : (
                <div className="order-history-list">
                  {userOrders.length === 0 ? (
                    <div className="cart-empty" style={{ padding: '2rem 0' }}>
                      <Package size={40} strokeWidth={1.2} />
                      <p>No orders found for {user?.email}</p>
                      <span>Your placed orders will appear here!</span>
                    </div>
                  ) : (
                    userOrders.map(order => (
                      <div
                        key={order.id}
                        className="order-card"
                        onClick={() => setSelectedOrder(order)}
                        style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--bg3)', borderRadius: '14px', padding: '1rem', marginBottom: '0.75rem', background: '#fff' }}
                      >
                        <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                          <div>
                            <span className="order-id" style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#0f172a' }}>{order.id}</span>
                            <span className="order-date" style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.date}</span>
                            <div style={{ fontSize: '0.78rem', color: 'var(--maroon)', fontWeight: 600, marginTop: '2px' }}>
                              Tracking ID: TRACK-{order.id.replace('ACK-', '')}
                            </div>
                          </div>
                          <span className="order-status-badge" style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>{order.status}</span>
                        </div>

                        <div className="order-items-preview" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', padding: '0.5rem 0', margin: '0.5rem 0' }}>
                          {order.items?.map(item => (
                            <div key={item.id} className="order-item-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <ImageWithFallback src={item.image} alt={item.title} className="order-item-thumb" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: 'var(--bg2)', padding: '2px' }} />
                              <div className="order-item-meta" style={{ flex: 1, minWidth: 0 }}>
                                <span className="order-item-title" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                                <span className="order-item-qty" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.qty} • ₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="order-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                          <span>Total: <strong>₹{order.total.toLocaleString('en-IN')}</strong></span>
                          <span style={{ color: 'var(--maroon)', fontWeight: 600, fontSize: '0.78rem' }}>
                            🔍 Tap to view details & tracking →
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Selected Order Full Details Pop-over Modal */}
        {selectedOrder && (
          <div className="order-details-modal-overlay" onClick={() => setSelectedOrder(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="order-details-modal" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: '520px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--maroon), var(--maroon-dark))', color: '#fff', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif' }}>Order Details & Tracking</h3>
                  <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{selectedOrder.id} • {selectedOrder.date}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '1.25rem 1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
                {/* Status Banner */}
                <div style={{ background: '#fdf2f4', border: '1px solid #fecdd3', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Current Status</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--maroon)' }}>{selectedOrder.status || 'Payment Pending (QR Sent)'}</div>
                  </div>
                  <span className="order-status-badge" style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>{selectedOrder.status}</span>
                </div>

                {/* Tracking ID Box */}
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Real-Time Tracking ID</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#0f172a' }}>TRACK-{selectedOrder.id.replace('ACK-', '')}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`TRACK-${selectedOrder.id.replace('ACK-', '')}`);
                      setCopiedTracking(true);
                      setTimeout(() => setCopiedTracking(false), 2000);
                    }}
                    style={{ background: copiedTracking ? '#16a34a' : 'var(--maroon)', color: '#fff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {copiedTracking ? '✓ Copied' : 'Copy ID'}
                  </button>
                </div>

                {/* Customer Shipping Details */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text)', borderBottom: '1px solid var(--bg3)', paddingBottom: '0.35rem' }}>Shipping Address & Customer Info</h4>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <div><strong>Name:</strong> {selectedOrder.name || user?.name || 'Valued Collector'}</div>
                    <div><strong>Email:</strong> {selectedOrder.email}</div>
                    <div><strong>WhatsApp:</strong> {selectedOrder.phone || user?.phone}</div>
                    <div><strong>Delivery Address:</strong> {selectedOrder.address}</div>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', color: 'var(--text)', borderBottom: '1px solid var(--bg3)', paddingBottom: '0.35rem' }}>Order Items ({selectedOrder.items?.length || 0})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <ImageWithFallback src={item.image} alt={item.title} style={{ width: '46px', height: '46px', objectFit: 'contain', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--maroon)' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div style={{ background: '#fdf2f4', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                    <span>Subtotal</span>
                    <span>₹{(selectedOrder.subtotal || selectedOrder.total).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                    <span>Shipping Fee</span>
                    <span>{selectedOrder.shippingFee === 0 || selectedOrder.total >= 999 ? 'FREE' : `₹${selectedOrder.shippingFee || 79}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: 'var(--maroon)', borderTop: '1px solid #fecdd3', paddingTop: '0.35rem' }}>
                    <span>Grand Total</span>
                    <span>₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ id, icon, title, accent, products, onAdd, cart }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id={id} className={`shop-section ${visible ? 'section-visible' : ''}`} ref={ref}>
      <div className="section-header">
        <span className="section-icon" style={{ color: accent }}>{icon}</span>
        <h2 className="section-title">{title}</h2>
        <div className="section-line" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      </div>
      <div className="product-grid">
        {products.length === 0 ? (
          <div className="empty-state">No products available yet.</div>
        ) : products.map((p, i) => (
          <div key={p.id} className="card-animate" style={{ animationDelay: `${i * 0.12}s` }}>
            <div className="card-glow-wrap">
              <ProductCard product={p} currentQty={cart.find(item => item.id === p.id)?.qty || 0} onAdd={onAdd} onView={openQuickView} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: '10,000+', label: 'Happy Collectors' },
    { value: '500+', label: 'Unique Products' },
    { value: '4.9★', label: 'Average Rating' },
    { value: 'Pan India', label: 'Free Delivery ₹999+' },
  ];
  return (
    <div className="stats-bar">
      {stats.map((s, i) => (
        <div key={i} className="stat-item">
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { icon: <ShieldCheck size={32} />, title: '100% Authentic', desc: 'Guaranteed original merchandise from top Japanese manufacturers. No bootlegs, ever.' },
    { icon: <Truck size={32} />, title: 'Fast & Secure Delivery', desc: 'Express shipping across India. Packed with extreme care so your boxes arrive pristine.' },
    { icon: <Gem size={32} />, title: 'Exclusive Curations', desc: 'We bring in rare, hard-to-find drops and limited editions that true Otakus crave.' },
    { icon: <Medal size={32} />, title: 'Premium Experience', desc: 'From the unboxing to the customer service, we treat every order like a collector\'s piece.' },
  ];
  return (
    <section className="features-section">
      <div className="features-header">
        <h2 className="features-title">What Makes Us Different</h2>
        <div className="features-line" />
      </div>
      <div className="features-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-heading">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const [page, setPage] = useState(window.location.hash === '#collection' ? 'collection' : 'home');
  const [scrolled, setScrolled] = useState(false);
  const [inventoryProducts, setInventoryProducts] = useState(EMPTY_PRODUCTS);
  const [carouselPaused, setCarouselPaused] = useState(false);

  useEffect(() => {
    if (carouselPaused) return;
    const interval = setInterval(() => {
      const el = collectionScrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [inventoryProducts, carouselPaused]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const collectionScrollRef = useRef(null);

  useEffect(() => {
    let intervalId = setInterval(() => {
      if (collectionScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = collectionScrollRef.current;
        // Check if we've reached the end
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          collectionScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll exactly one card width
          const cardWidth = collectionScrollRef.current.querySelector('.carousel-card')?.offsetWidth || 320;
          collectionScrollRef.current.scrollBy({ left: cardWidth + 24, behavior: 'smooth' }); // 24 is gap
        }
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [inventoryProducts]);

  const navigate = (target) => {
    if (target === 'collection') {
      window.location.hash = '#collection';
    } else {
      window.location.hash = '';
    }
    setPage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onHashChange = () => {
      setPage(window.location.hash === '#collection' ? 'collection' : 'home');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sheetsApiUrl = 'https://script.google.com/macros/s/AKfycbxjh2XHXRmN51lCyEkE72ei6Vgnfc4TwZC4mobv7bxC37ZH-S-D_UCVnSyYknt8oCh7mg/exec';

    let isMounted = true;

    const loadInventory = async () => {
      try {
        const response = await fetch(sheetsApiUrl, {
          cache: 'no-store',
          mode: 'cors',
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON, but got ${contentType || 'unknown'} — check that the Apps Script is deployed correctly`);
        }

        const payload = await response.json();
        const products = Array.isArray(payload?.products) ? payload.products : [];

        if (products.length === 0) {
          throw new Error('No products found in Google Sheets. Check your sheet has data in the Inventory tab.');
        }

        const loadedProducts = buildProductsByCategory(products);

        if (isMounted) {
          setInventoryProducts(loadedProducts);
        }
      } catch (error) {
        console.error('Failed to load inventory from Google Sheets:', error);
        if (isMounted) {
          setInventoryProducts(EMPTY_PRODUCTS);
        }
      }
    };

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAdd = (product) => {
    const maxAvailable = product.stockQuantity ?? product.stock ?? 10;

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= maxAvailable) return prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }

      if (maxAvailable <= 0) return prev;
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleToggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      return [...prev, product];
    });
  };

  const handleRemove = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const handleUpdateQty = (id, delta) => {
    setCart(prev => prev
      .map(i => {
        if (i.id !== id) return i;
        const maxAvailable = i.stockQuantity ?? i.stock ?? 10;
        return { ...i, qty: Math.max(0, Math.min(i.qty + delta, maxAvailable)) };
      })
      .filter(i => i.qty > 0)
    );
  };

  const [collectionCategory, setCollectionCategory] = useState('all');
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('animecurio_current_user') || localStorage.getItem('animecurio_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('animecurio_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handlePlaceOrder = (newOrder) => {
    // 1. Save to React state + localStorage
    setOrders(prev => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('animecurio_orders', JSON.stringify(updated));
      if (newOrder.email) {
        const userKey = `animecurio_orders_${newOrder.email.toLowerCase()}`;
        const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
        localStorage.setItem(userKey, JSON.stringify([newOrder, ...existing.filter(o => o.id !== newOrder.id)]));
      }
      return updated;
    });
    setCart([]);

    // 2. Write to Cloudflare D1 via Pages Function
    fetch(`${D1_API}/orders`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: newOrder.id,
        customerName: newOrder.name,
        customerEmail: newOrder.email,
        customerPhone: newOrder.phone,
        address: newOrder.address,
        city: newOrder.city,
        state: newOrder.state,
        pincode: newOrder.pincode,
        totalAmount: newOrder.total,
        paymentStatus: newOrder.status,
        itemsJson: JSON.stringify(newOrder.items)
      })
    }).catch(err => console.log('D1 order sync note:', err));
  };

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem('animecurio_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterSubscribed(false);
      setNewsletterEmail('');
    }, 4000);
  };

  const navigateToCollection = (categoryKey = 'all') => {
    setCollectionCategory(categoryKey);
    setDropdownOpen(false);
    navigate('collection');
  };

  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    setQuickViewImageIndex(0);
    setProductReviews([]);
    setReviewsLoading(true);
    fetch(`${D1_API}/reviews?productId=${product.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProductReviews(data.reviews || []);
        setReviewsLoading(false);
      })
      .catch(() => setReviewsLoading(false));

    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 8);
      localStorage.setItem('animecurio_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
    setNewReviewText('');
    setNewReviewRating(5);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to leave a review.');
    if (!newReviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`${D1_API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: quickViewProduct.id,
          userId: user.id || user.email,
          userName: user.name,
          rating: newReviewRating,
          comment: newReviewText
        })
      });
      const data = await res.json();
      if (data.success) {
        setProductReviews([{ id: data.reviewId, userName: user.name, rating: newReviewRating, comment: newReviewText, date: new Date().toLocaleDateString('en-IN') }, ...productReviews]);
        setNewReviewText('');
        setNewReviewRating(5);
      }
    } catch (err) {
      alert('Failed to submit review');
    }
    setSubmittingReview(false);
  };

  const allFlattenedProducts = Object.values(inventoryProducts).flat();
  const similarProducts = quickViewProduct
    ? allFlattenedProducts
        .filter(p => p.id !== quickViewProduct.id && (p.category === quickViewProduct.category || p.categoryId === quickViewProduct.categoryId))
        .slice(0, 4)
    : [];
  const displaySimilarProducts = similarProducts.length >= 2
    ? similarProducts
    : allFlattenedProducts.filter(p => p.id !== quickViewProduct?.id).slice(0, 4);

  const cartTotal = cart.reduce((s, i) => s + i.qty, 0);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app">
      {/* Header */}
      <header className={`site-header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="logo" onClick={() => navigate('home')}>
          AnimeCurio
        </div>
        <nav className="site-nav">
          <button className="nav-link" onClick={() => navigate('home')}>Home</button>
          <div 
            className={`collection-dropdown ${dropdownOpen ? 'open' : ''}`}
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              className="nav-link collection-toggle"
              onClick={(e) => {
                e.preventDefault();
                setDropdownOpen(!dropdownOpen);
              }}
            >
              Collection ▾
            </button>
            <div className="collection-menu">
              <button
                className="nav-link"
                onClick={() => navigateToCollection('all')}
              >
                All Products
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  className="nav-link"
                  onClick={() => navigateToCollection(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
        {/* Desktop header action buttons */}
        <div className="header-actions">
          <button
            className="header-action-btn action-community"
            onClick={() => window.open('https://wa.me/918360048865?text=Hi%20AnimeCurio!%20I%20want%20to%20join%20the%20AnimeCurio%20VIP%20Community.', '_blank')}
          >
            <Users size={24} />
            <span>Community</span>
          </button>
          <button
            className="header-action-btn action-new"
            onClick={() => navigateToCollection('new')}
          >
            <Star size={24} />
            <span>New</span>
          </button>
          <button className="header-action-btn action-wishlist" onClick={() => setWishlistOpen(true)}>
            <div className="cart-icon-wrapper">
              <Heart size={24} />
              {wishlist.length > 0 && <span className="cart-badge">{wishlist.length}</span>}
            </div>
            <span>Wishlist</span>
          </button>
          <button className="header-action-btn action-cart" onClick={() => setCartOpen(true)}>
            <div className="cart-icon-wrapper">
              <ShoppingCart size={24} />
              {cartTotal > 0 && <span className="cart-badge">{cartTotal}</span>}
            </div>
            <span>Cart</span>
          </button>
          <button className="header-action-btn action-account" onClick={() => setAccountOpen(true)}>
            {user ? <User size={24} /> : <KeyRound size={24} />}
            <span>{user ? 'Account' : 'Sign In'}</span>
          </button>
        </div>
        <div className="header-right-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="search-btn-header" onClick={() => setSearchOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: scrolled ? '#000' : 'var(--text)', display: 'flex', alignItems: 'center', transition: 'all 0.2s', padding: '0.2rem' }}>
            <Search size={22} />
          </button>
          <img src="/logo.jpeg" alt="AnimeCurio Logo" className="header-logo-img" />
        </div>
      </header>

      {/* Mobile Bottom Nav — only visible on mobile via CSS */}
      <nav className="mobile-bottom-nav">
        <button
          className="header-action-btn action-community"
          onClick={() => window.open('https://wa.me/918360048865?text=Hi%20AnimeCurio!%20I%20want%20to%20join%20the%20AnimeCurio%20VIP%20Community.', '_blank')}
        >
          <Users size={24} />
          <span>Community</span>
        </button>
        <button
          className="header-action-btn action-new"
          onClick={() => navigateToCollection('new')}
        >
          <Star size={24} />
          <span>New</span>
        </button>
        <button className="header-action-btn action-wishlist" onClick={() => setWishlistOpen(true)}>
          <div className="cart-icon-wrapper">
            <Heart size={24} />
            {wishlist.length > 0 && <span className="cart-badge">{wishlist.length}</span>}
          </div>
          <span>Wishlist</span>
        </button>
        <button className="header-action-btn action-cart" onClick={() => setCartOpen(true)}>
          <div className="cart-icon-wrapper">
            <ShoppingCart size={24} />
            {cartTotal > 0 && <span className="cart-badge">{cartTotal}</span>}
          </div>
          <span>Cart</span>
        </button>
        <button className="header-action-btn action-account" onClick={() => setAccountOpen(true)}>
          {user ? <User size={24} /> : <KeyRound size={24} />}
          <span>{user ? 'Account' : 'Sign In'}</span>
        </button>
      </nav>

      {/* Wishlist Sidebar */}
      {wishlistOpen && (
        <WishlistSidebar
          wishlist={wishlist}
          onClose={() => setWishlistOpen(false)}
          onAdd={handleAdd}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {/* Cart */}
      {cartOpen && (
        <CartSidebar
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemove={handleRemove}
          onUpdateQty={handleUpdateQty}
          onPlaceOrder={handlePlaceOrder}
          user={user}
          setUser={setUser}
          onOpenAccount={() => setAccountOpen(true)}
        />
      )}

      {/* Account / Profile Modal */}
      {accountOpen && (
        <AccountModal
          user={user}
          setUser={setUser}
          orders={orders}
          onClose={() => setAccountOpen(false)}
        />
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className="account-modal-overlay" onClick={() => setSearchOpen(false)}>
          <div className="account-modal" onClick={e => e.stopPropagation()} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '80vh', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--maroon)', margin: 0 }}>Search Products</h2>
              <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Search by name or category..."
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', fontFamily: 'inherit' }}
              onChange={e => {
                const query = e.target.value.toLowerCase();
                if (!query) return setSearchResult([]);
                const all = Object.values(inventoryProducts).flat();
                setSearchResult(all.filter(p => p.title.toLowerCase().includes(query) || (p.category && p.category.toLowerCase().includes(query))));
              }}
            />
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {searchResult.slice(0, 20).map(p => (
                <div key={p.id} onClick={() => { setQuickViewProduct(p); setSearchOpen(false); }} style={{ display: 'flex', gap: '1rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', alignItems: 'center', borderBottom: '1px solid #eee', background: '#fff' }} onMouseOver={e => e.currentTarget.style.background='#fdf2f4'} onMouseOut={e => e.currentTarget.style.background='#fff'}>
                  <ImageWithFallback src={p.image} alt={p.title} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text)' }}>{p.title}</div>
                    <div style={{ color: 'var(--maroon)', fontSize: '0.85rem', fontWeight: 'bold' }}>₹{p.price.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
              {searchResult.length === 0 && <div style={{ textAlign: 'center', color: '#999', marginTop: '2rem', fontSize: '0.9rem' }}>Start typing to find products...</div>}
            </div>
          </div>
        </div>
      )}

      {page === 'home' ? (
        <>
          {/* Hero */}
          <section className="hero">
            <div className="hero-bg" />
            <div className="hero-glow glow-pink" />
            <div className="hero-glow glow-cyan" />
            <div className="hero-content">
              <h1 className="hero-title">
                Elevate Your <span className="hero-accent">Anime Collection</span>
              </h1>
              <p className="hero-desc">
                Discover highly detailed figurines, curated combo boxes, and rare mystery gacha balls.
                Premium merchandise crafted for true enthusiasts.
              </p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => navigate('collection')}>
                  <Zap size={16} /> Start Collecting
                </button>
                <button className="btn-secondary" onClick={() => setAccountOpen(true)} style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
                  <KeyRound size={16} /> Login / Sign Up
                </button>
              </div>
            </div>
            <button className="scroll-hint" onClick={() => scrollTo('figurines')}>
              <ChevronDown size={24} />
            </button>
          </section>

          <StatsBar />

          {/* Features moved down below collection */}

          {/* Collection preview (carousel + pills) on Home */}
          <div className="collection-page">
            <div className="collection-page-header">
              <div>
                <h2 className="collection-title">Top Collectibles</h2>
                <p className="collection-copy">Browse the latest premium figures front and center, then explore every product in the collection.</p>
              </div>
              <div className="collection-carousel-wrap">
                <button type="button" className="carousel-arrow left" onClick={() => collectionScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}>‹</button>
                <div 
                  className="collection-carousel" 
                  ref={collectionScrollRef}
                  onMouseEnter={() => setCarouselPaused(true)}
                  onMouseLeave={() => setCarouselPaused(false)}
                >
                  {[...(inventoryProducts['anime-figures'] || [])].reverse().slice(0, 7).map((item, idx) => (
                    <div 
                      key={item.id} 
                      className="card-animate" 
                      style={{ 
                        flex: '0 0 min(320px, 100%)', 
                        scrollSnapAlign: 'center',
                        padding: '4px'
                      }}
                    >
                      <div className="card-glow-wrap">
                        <div 
                          className={`carousel-card carousel-card-color-${(idx % 5) + 1}`} 
                          onClick={() => openQuickView(item)} 
                          style={{ cursor: 'pointer', position: 'relative', border: 'none' }}
                        >
                          <button 
                              className={`wishlist-btn ${wishlist.find(p => p.id === item.id) ? 'active' : ''}`}
                              style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 10 }}
                              onClick={(e) => { e.stopPropagation(); handleToggleWishlist(item); }}
                              title="Toggle Wishlist"
                          >
                              <Heart 
                                  size={18} 
                                  fill={wishlist.find(p => p.id === item.id) ? "#ef4444" : "#ffe4e6"} 
                                  color={wishlist.find(p => p.id === item.id) ? "#ef4444" : "#c2485b"} 
                              />
                          </button>
                          <ImageWithFallback
                            src={item.image}
                            alt={item.title}
                            className="carousel-image"
                          />
                          <div className="carousel-meta">
                            <span className="carousel-name">{item.title}</span>
                            <div className="carousel-price-group">
                              <span className="carousel-price"><span className="currency-symbol">₹</span>{item.price.toLocaleString('en-IN')}</span>
                              {item.actualPrice > item.price && (
                                <span className="carousel-mrp-group">
                                  <span className="carousel-mrp-label">M.R.P:</span>
                                  <span className="carousel-price-old">₹{item.actualPrice.toLocaleString('en-IN')}</span>
                                  {item.discountPercent > 0 && <span className="carousel-discount">({item.discountPercent}% off)</span>}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="carousel-arrow right" onClick={() => collectionScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}>›</button>
              </div>
            </div>


          </div>

          {/* Features */}
          <FeaturesSection />

          {/* Products removed from home (collection has separate page) */}
        </>
      ) : (
        <CollectionPage
          inventoryProducts={inventoryProducts}
          onAdd={handleAdd}
          cart={cart}
          onBack={() => navigate('home')}
          onView={openQuickView}
          initialCategory={collectionCategory}
          recentlyViewed={recentlyViewed}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {quickViewProduct && (
        <>
          <div className="cart-overlay" onClick={closeQuickView} />
          <div className="product-modal">
            {/* Prev / Next product navigation */}
            {(() => {
              const idx = allFlattenedProducts.findIndex(p => p.id === quickViewProduct.id);
              const hasPrev = idx > 0;
              const hasNext = idx < allFlattenedProducts.length - 1;
              return (
                <>
                  {hasPrev && (
                    <button
                      className="modal-nav-btn modal-nav-prev"
                      onClick={(e) => { e.stopPropagation(); openQuickView(allFlattenedProducts[idx - 1]); }}
                      title="Previous product"
                    >
                      ‹
                    </button>
                  )}
                  {hasNext && (
                    <button
                      className="modal-nav-btn modal-nav-next"
                      onClick={(e) => { e.stopPropagation(); openQuickView(allFlattenedProducts[idx + 1]); }}
                      title="Next product"
                    >
                      ›
                    </button>
                  )}
                </>
              );
            })()}
            <button className="product-modal-close" onClick={closeQuickView}>
              <X size={24} />
            </button>
            <div className="product-modal-grid">
              <div className="product-modal-left" style={{ position: 'relative' }}>
                <ImageWithFallback
                  src={quickViewProduct.galleryImages?.[quickViewImageIndex]?.url || quickViewProduct.image}
                  alt={quickViewProduct.title}
                  className="product-modal-main-img"
                />
                <button 
                    className={`wishlist-btn ${wishlist.find(p => p.id === quickViewProduct.id) ? 'active' : ''}`}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
                    onClick={(e) => { e.stopPropagation(); handleToggleWishlist(quickViewProduct); }}
                    title="Toggle Wishlist"
                >
                    <Heart 
                        size={20} 
                        fill={wishlist.find(p => p.id === quickViewProduct.id) ? "#ef4444" : "#ffe4e6"} 
                        color={wishlist.find(p => p.id === quickViewProduct.id) ? "#ef4444" : "#c2485b"} 
                    />
                </button>
                {quickViewProduct.galleryImages?.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="product-nav product-nav-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewImageIndex((prev) => (prev - 1 + quickViewProduct.galleryImages.length) % quickViewProduct.galleryImages.length);
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="product-nav product-nav-right"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewImageIndex((prev) => (prev + 1) % quickViewProduct.galleryImages.length);
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                {quickViewProduct.galleryImages?.length > 1 && (
                  <div className="product-modal-thumbs">
                    {quickViewProduct.galleryImages.map((item, index) => (
                      <button
                        key={`${item.label}-${index}`}
                        type="button"
                        className={`product-modal-thumb ${index === quickViewImageIndex ? 'active' : ''}`}
                        onClick={() => setQuickViewImageIndex(index)}
                      >
                        <ImageWithFallback
                          src={item.url}
                          alt={item.label}
                          className="product-modal-thumb-img"
                          fallbackImage="/placeholder.svg"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="product-modal-right">
                <div className="product-modal-header">
                  <span className="product-modal-badge" style={{ background: quickViewProduct.badgeColor }}>
                    {quickViewProduct.badge}
                  </span>
                  <span className="product-modal-stock">{quickViewProduct.inStock ? `In Stock (${quickViewProduct.stockQuantity} left)` : 'Sold Out'}</span>
                </div>
                <h2 className="product-modal-title">{quickViewProduct.title}</h2>
                <p className="product-modal-subtitle">{quickViewProduct.subtitle}</p>
                <div className="product-modal-specs">
                  <div className="spec-row">
                    <span>Price</span>
                    <div className="product-price-group">
                      <span className="product-price"><span className="currency-symbol">₹</span>{quickViewProduct.price.toLocaleString('en-IN')}</span>
                      {quickViewProduct.actualPrice > quickViewProduct.price && (
                        <span className="product-mrp-group">
                          <span className="product-mrp-label">M.R.P:</span>
                          <span className="product-price-old">₹{quickViewProduct.actualPrice.toLocaleString('en-IN')}</span>
                          {quickViewProduct.discountPercent > 0 && <span className="product-discount">({quickViewProduct.discountPercent}% off)</span>}
                        </span>
                      )}
                    </div>
                  </div>
                  {quickViewProduct.scale && <div className="spec-row"><span>Size</span><strong>{quickViewProduct.scale}</strong></div>}
                  <div className="spec-row"><span>Reviews</span><strong>{quickViewProduct.reviews} reviews</strong></div>
                </div>
                {quickViewProduct.features?.length > 0 && (
                  <div className="product-modal-features">
                    <h4>Features</h4>
                    <p>{quickViewProduct.features.slice(0, 3).join(' | ')}</p>
                  </div>
                )}

                {/* Combo Character Swap — lets user choose alternative figures at the same price */}
                {quickViewProduct.categoryId == 13 && (() => {
                  const targetSwapPrice = quickViewProduct.swap_price ? Number(quickViewProduct.swap_price) : 149;
                  const swapOptions = Object.values(inventoryProducts).flat()
                    .filter(p => p.categoryId == 1 && p.price === targetSwapPrice && p.id !== quickViewProduct.id && p.inStock);
                  
                  if (swapOptions.length === 0) return null;
                  return (
                    <div className="combo-swap-section" style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#fdf2f4', borderRadius: '12px', border: '1px solid #fce7eb' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--maroon)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={16} /> Swap Character — (₹{targetSwapPrice.toLocaleString('en-IN')})
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                        You can choose any of these characters instead for this combo:
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {swapOptions.map(alt => (
                          <div
                            key={alt.id}
                            onClick={() => openQuickView(alt)}
                            style={{
                              background: '#fff',
                              border: '1.5px solid var(--bg3)',
                              borderRadius: '12px',
                              padding: '0.4rem',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--maroon)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <ImageWithFallback src={alt.image} alt={alt.title} style={{ width: '100%', height: '60px', objectFit: 'contain', borderRadius: '6px' }} />
                            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alt.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Figure -> Combo Upsell */}
                {quickViewProduct.categoryId == 1 && (() => {
                  const figurePrice = quickViewProduct.price;
                  const availableCombos = Object.values(inventoryProducts).flat()
                    .filter(c => c.categoryId == 13 && (c.swap_price ? Number(c.swap_price) : c.price) === figurePrice && c.inStock);
                  
                  if (availableCombos.length === 0) return null;
                  return (
                    <div className="combo-upsell-section" style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#166534', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Package size={16} /> Available in a Combo!
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: '#14532d', marginBottom: '0.6rem' }}>
                        Get this figure bundled in one of these premium combos:
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {availableCombos.map(alt => (
                          <div
                            key={alt.id}
                            onClick={() => openQuickView(alt)}
                            style={{
                              background: '#fff',
                              border: '1.5px solid #bbf7d0',
                              borderRadius: '12px',
                              padding: '0.4rem',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#bbf7d0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <ImageWithFallback src={alt.image} alt={alt.title} style={{ width: '100%', height: '60px', objectFit: 'contain', borderRadius: '6px' }} />
                            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alt.title}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534' }}>₹{alt.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="product-modal-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      handleAdd(quickViewProduct);
                      closeQuickView();
                    }}
                    disabled={!quickViewProduct.inStock}
                  >
                    {quickViewProduct.inStock ? 'Add to Cart' : 'Sold Out'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-buy-now"
                    onClick={() => {
                      if (!quickViewProduct.inStock) return;
                      handleAdd(quickViewProduct);
                      closeQuickView();
                      setCartOpen(true);
                    }}
                    disabled={!quickViewProduct.inStock}
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="product-reviews-section" style={{ gridColumn: '1 / -1', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bg3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text)', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Star size={18} color="var(--maroon)" /> Customer Reviews ({productReviews.length})
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                  {/* Reviews List */}
                  <div>
                    {reviewsLoading ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading reviews...</div>
                    ) : productReviews.length === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg2)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>No reviews yet. Be the first to review!</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {productReviews.map(review => (
                          <div key={review.id} style={{ background: '#fff', border: '1px solid var(--bg3)', borderRadius: '12px', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{review.userName}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{review.date}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.15rem', marginBottom: '0.5rem', color: '#fbbf24' }}>
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={14} fill={star <= review.rating ? 'currentColor' : 'none'} strokeWidth={star <= review.rating ? 0 : 2} />
                              ))}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Review Form */}
                  <div style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text)' }}>Write a Review</h4>
                    {!user ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                        Please sign in from your account to leave a review.
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview}>
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>Rating</label>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReviewRating(star)}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: star <= newReviewRating ? '#fbbf24' : '#cbd5e1' }}
                              >
                                <Star size={24} fill={star <= newReviewRating ? 'currentColor' : 'none'} strokeWidth={star <= newReviewRating ? 0 : 2} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>Your Review</label>
                          <textarea
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            required
                            rows={3}
                            placeholder="What did you think about this product?"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg3)', fontSize: '0.85rem', resize: 'vertical' }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingReview || !newReviewText.trim()}
                          className="btn-primary"
                          style={{ width: '100%', padding: '0.75rem' }}
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Similar Products Recommendation */}
              {displaySimilarProducts.length > 0 && (
                <div className="similar-products-modal-section" style={{ gridColumn: '1 / -1', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bg3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <h3 style={{ fontSize: '0.98rem', color: 'var(--maroon)', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={18} color="var(--maroon)" /> Similar Collectibles You May Also Like
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Explore more</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {displaySimilarProducts.map(item => (
                      <div
                        key={item.id}
                        className="similar-card-item"
                        onClick={() => openQuickView(item)}
                        style={{ background: '#fff', border: '1px solid var(--bg3)', borderRadius: '14px', padding: '0.6rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                      >
                        <ImageWithFallback src={item.image} alt={item.title} style={{ width: '100%', height: '85px', objectFit: 'contain', borderRadius: '8px' }} />
                        <div style={{ fontSize: '0.76rem', fontWeight: 'bold', color: 'var(--text)', margin: '0.4rem 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--maroon)', fontWeight: 'bold' }}>₹{item.price.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-cards-wrapper">
          {/* Email Newsletter Subscription */}
          <div className="newsletter-card">
            <div className="newsletter-icon">📬</div>
            <h3>Subscribe to our emails</h3>
            <p>Get the latest deals, new arrivals, and exclusive offers straight to your inbox.</p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
              />
              <button type="submit">Subscribe</button>
            </form>
            {newsletterSubscribed && (
              <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                ✓ Thank you for subscribing! Check your inbox for VIP drops.
              </div>
            )}
            <p className="newsletter-note">No spam. Unsubscribe anytime.</p>
          </div>


        </div>

        <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <img src="/logo.jpeg" alt="AnimeCurio Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />
          AnimeCurio
        </div>
        <p className="footer-copy">© 2026 AnimeCurio. All rights reserved. | Made with ❤️ in India</p>
        <p className="footer-sub">Proudly serving anime fans across Bharat 🇮🇳</p>
      </footer>
    </div>
  );
}
