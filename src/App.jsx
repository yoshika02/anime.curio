import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X, Star, Zap, Package, Sparkles, ChevronDown, KeyRound, ShieldCheck, Truck, Gem, Medal, Users, User } from 'lucide-react';
import CollectionPage from './CollectionPage';
import ProductCard from './ProductCard';
import ImageWithFallback, { getPrimaryImageUrl } from './imageUtils';

// ─── Product Data ────────────────────────────────────────────────────────────
const EMPTY_PRODUCTS = {
  figurines: [],
  combos: [],
  mystery: [],
  keychains: [],
};

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

  const badge = stockQuantity > 0 && stockQuantity < 5
    ? 'Rare Available'
    : String(rawProduct?.badge || (inStock ? 'In Stock' : 'Sold Out')).trim();
  const badgeColor = String(rawProduct?.badgeColor || (stockQuantity > 0 && stockQuantity < 5 ? '#f59e0b' : inStock ? '#a31a1a' : '#666666')).trim();
  const galleryImages = collectProductGallery(rawProduct);
  const image = galleryImages[0]?.url || resolveImageUrl(getImageField(rawProduct));
  const features = Array.isArray(rawProduct?.features)
    ? rawProduct.features.map(String)
    : typeof rawProduct?.features === 'string'
      ? rawProduct.features.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  const categoryId = Number(rawProduct?.category || rawProduct?.category_id || rawProduct?.categoryId || 0);
  const categoryKey = {
    1: 'figurines',
    2: 'keychains',
    3: 'figurines',
    4: 'combos',
    5: 'mystery',
    6: 'figurines',
    7: 'figurines',
    8: 'figurines',
    9: 'figurines',
    10: 'combos',
    11: 'figurines',
    12: 'figurines',
  }[categoryId] || 'figurines';

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
    image,
    galleryImages,
    stockQuantity,
    inStock,
    features,
    category: categoryKey,
    categoryId,
  };
}

function buildProductsByCategory(rawProducts = []) {
  const grouped = {
    figurines: [],
    combos: [],
    mystery: [],
    keychains: [],
  };

  rawProducts.forEach((product, index) => {
    const normalized = normalizeProduct(product, index);
    if (grouped[normalized.category]) {
      grouped[normalized.category].push(normalized);
    }
  });

  return grouped;
}


// ─── Cart Sidebar ─────────────────────────────────────────────────────────────
function CartSidebar({ cart, onClose, onRemove, onUpdateQty }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <aside className="cart-sidebar">
        <div className="cart-header">
          <h2 className="cart-title">Your Cart</h2>
          <button className="cart-close" onClick={onClose}><X size={20} /></button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={48} strokeWidth={1} />
            <p>Your cart is empty</p>
            <span>Add some amazing merch!</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.title} className="cart-item-img" />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.title}</p>
                    <div className="cart-item-price-group">
                      <span className="cart-item-price">₹{item.price.toLocaleString('en-IN')}</span>
                      {item.actualPrice > item.price && (
                        <>
                          <span className="cart-item-price-old">₹{item.actualPrice.toLocaleString('en-IN')}</span>
                          {item.discountPercent > 0 && <span className="cart-item-discount">-{item.discountPercent}%</span>}
                        </>
                      )}
                    </div>
                    <p style={{ marginTop: 6, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Qty: {item.qty} • Subtotal ₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
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
              <div className="cart-total">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <button className="btn-checkout">Checkout →</button>
            </div>
          </>
        )}
      </aside>
    </>
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
  const [cartOpen, setCartOpen] = useState(false);
  const [page, setPage] = useState(window.location.hash === '#collection' ? 'collection' : 'home');
  const [scrolled, setScrolled] = useState(false);
  const [inventoryProducts, setInventoryProducts] = useState(EMPTY_PRODUCTS);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const collectionScrollRef = useRef(null);

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

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    setQuickViewImageIndex(0);
  };

  const closeQuickView = () => setQuickViewProduct(null);

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
          <div className="collection-dropdown">
            <button
              className="nav-link collection-toggle"
              onClick={() => navigate('collection')}
            >
              Collection ▾
            </button>
            <div className="collection-menu">
              <button
                className="nav-link"
                onClick={() => navigate('collection')}
              >
                All Products
              </button>
              <button
                className="nav-link"
                onClick={() => navigate('collection')}
              >
                1. Anime Figurines
              </button>
              <button
                className="nav-link"
                onClick={() => navigate('collection')}
              >
                2. Exclusive Combos
              </button>
              <button
                className="nav-link"
                onClick={() => navigate('collection')}
              >
                3. Mystery Gacha Balls
              </button>
              <button
                className="nav-link"
                onClick={() => navigate('collection')}
              >
                4. Anime Key Chains
              </button>
            </div>
          </div>
        </nav>
        <div className="header-actions">
          <button className="header-action-btn action-community">
            <Users size={24} />
            <span>Community</span>
          </button>
          <button className="header-action-btn action-new">
            <Star size={24} />
            <span>New</span>
          </button>
          <button className="header-action-btn action-cart" onClick={() => setCartOpen(true)}>
            <div className="cart-icon-wrapper">
              <ShoppingCart size={24} />
              {cartTotal > 0 && <span className="cart-badge">{cartTotal}</span>}
            </div>
            <span>Cart</span>
          </button>
          <button className="header-action-btn action-account">
            <User size={24} />
            <span>Account</span>
          </button>
        </div>
      </header>

      {/* Cart */}
      {cartOpen && (
        <CartSidebar
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemove={handleRemove}
          onUpdateQty={handleUpdateQty}
        />
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
                <button className="btn-secondary" onClick={() => scrollTo('mystery')}>
                  <Package size={16} /> Mystery Balls
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
                <button type="button" className="carousel-arrow left" onClick={() => collectionScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}>‹</button>
                <div className="collection-carousel" ref={collectionScrollRef}>
                  {(inventoryProducts.figurines || []).slice(0, 4).map((item) => (
                    <div key={item.id} className="carousel-card">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="carousel-image"
                      />
                      <div className="carousel-meta">
                        <span className="carousel-name">{item.title}</span>
                        <div className="carousel-price-group">
                          <span className="carousel-price">₹{item.price.toLocaleString('en-IN')}</span>
                          {item.actualPrice > item.price && (
                            <>
                              <span className="carousel-price-old">₹{item.actualPrice.toLocaleString('en-IN')}</span>
                              {item.discountPercent > 0 && <span className="carousel-discount">-{item.discountPercent}%</span>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="carousel-arrow right" onClick={() => collectionScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}>›</button>
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
        />
      )}

      {quickViewProduct && (
        <>
          <div className="cart-overlay" onClick={closeQuickView} />
          <div className="product-modal">
            <button className="product-modal-close" onClick={closeQuickView}>
              <X size={24} />
            </button>
            <div className="product-modal-grid">
              <div className="product-modal-left">
                <ImageWithFallback
                  src={quickViewProduct.galleryImages?.[quickViewImageIndex]?.url || quickViewProduct.image}
                  alt={quickViewProduct.title}
                  className="product-modal-main-img"
                />
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
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-logo">AnimeCurio</div>
        <p className="footer-copy">© 2026 AnimeCurio. All rights reserved. | Made with ❤️ in India</p>
        <p className="footer-sub">Proudly serving anime fans across Bharat 🇮🇳</p>
      </footer>
    </div>
  );
}
