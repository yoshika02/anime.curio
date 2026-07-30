import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X, Star, Zap, Package, Sparkles, ChevronDown, KeyRound, ShieldCheck, Truck, Gem, Medal } from 'lucide-react';
import CollectionPage from './CollectionPage';
import ProductCard from './ProductCard';

// ─── Product Data ────────────────────────────────────────────────────────────
const FALLBACK_PRODUCTS = {
  figurines: [
    {
      id: 1,
      title: 'Shadow Swordsman 1/7 Scale',
      subtitle: 'Demon Slayer Series',
      price: 10999,
      rating: 4.9,
      reviews: 312,
      badge: 'New',
      badgeColor: '#a31a1a',
      image: '/products/figurine_1.png',
    },
    {
      id: 2,
      title: 'Luminous Guardian Deluxe',
      subtitle: 'Dragon Arc Limited',
      price: 15999,
      rating: 4.8,
      reviews: 205,
      badge: 'Bestseller',
      badgeColor: '#800000',
      image: '/products/figurine_2.png',
    },
    {
      id: 3,
      title: 'Crystal Empress Statue',
      subtitle: 'Celestial Edition',
      price: 18499,
      rating: 5.0,
      reviews: 87,
      badge: 'Rare',
      badgeColor: '#4d0000',
      image: '/products/figurine_3.png',
    },
  ],
  combos: [
    {
      id: 4,
      title: "The Ultimate Collector's Box",
      subtitle: '3 Figurines + Poster + Art Book',
      price: 7499,
      rating: 4.7,
      reviews: 156,
      badge: 'Best Value',
      badgeColor: '#a31a1a',
      image: '/products/combo_1.png',
    },
    {
      id: 5,
      title: 'Starter Anime Bundle',
      subtitle: '2 Figurines + Mystery Ball',
      price: 4999,
      rating: 4.6,
      reviews: 98,
      badge: 'Bundle',
      badgeColor: '#660000',
      image: '/products/combo_2.png',
    },
  ],
  mystery: [
    {
      id: 6,
      title: 'Neon SSR Mystery Capsule',
      subtitle: 'Chance for Ultra-Rare Drops',
      price: 1999,
      rating: 4.5,
      reviews: 432,
      badge: 'Rare Drop',
      badgeColor: '#800000',
      image: '/products/mystery_1.png',
    },
    {
      id: 7,
      title: 'Golden Gacha Ball',
      subtitle: 'Legendary Series — 1% SSR',
      price: 2799,
      rating: 4.4,
      reviews: 278,
      badge: 'Legendary',
      badgeColor: '#a31a1a',
      image: '/products/mystery_2.png',
    },
    {
      id: 8,
      title: 'Rainbow Prism Capsule',
      subtitle: 'All Series Mix — Surprise!',
      price: 1599,
      rating: 4.3,
      reviews: 561,
      badge: 'Popular',
      badgeColor: '#4d0000',
      image: '/products/mystery_3.png',
    },
  ],
  keychains: [
    {
      id: 9,
      title: 'Chibi Demon Slayer Acrylic Set',
      subtitle: 'Set of 4 — Acrylic Keychain',
      price: 699,
      rating: 4.8,
      reviews: 874,
      badge: 'Trending',
      badgeColor: '#800000',
      image: '/products/keychain_1.png',
    },
    {
      id: 10,
      title: 'Metal Enamel Hero Keychain',
      subtitle: 'My Hero Academia — Premium',
      price: 999,
      rating: 4.7,
      reviews: 543,
      badge: 'Bestseller',
      badgeColor: '#4d0000',
      image: '/products/keychain_2.png',
    },
    {
      id: 11,
      title: 'Glow-in-Dark Naruto Kunai',
      subtitle: 'Naruto Shippuden — Glow Edition',
      price: 849,
      rating: 4.6,
      reviews: 321,
      badge: 'New',
      badgeColor: '#a31a1a',
      image: '/products/keychain_3.png',
    },
    {
      id: 12,
      title: 'Epoxy Crystal Waifu Charm',
      subtitle: 'Re:Zero — Limited Series',
      price: 599,
      rating: 4.9,
      reviews: 1204,
      badge: '♥ Fan Fav',
      badgeColor: '#660000',
      image: '/products/keychain_4.png',
    },
  ],
};

function normalizeProduct(rawProduct, fallbackIndex = 0) {
  const title = String(rawProduct?.title || rawProduct?.name || 'Unnamed product').trim();
  const subtitle = String(rawProduct?.subtitle || rawProduct?.description || '').trim();
  const price = Number(rawProduct?.price) || 0;
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
  const image = String(rawProduct?.image || '/products/placeholder.png').trim();
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
    rating,
    reviews,
    review: reviews,
    badge,
    badgeColor,
    image,
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

  const normalizeFallbackProduct = (product) => ({
    ...product,
    name: product.name || product.title,
    scale: product.scale || 'Standard',
    stockQuantity: product.stockQuantity ?? product.stock ?? 10,
    inStock: product.inStock !== false,
    features: product.features || [],
    review: product.review ?? product.reviews,
  });

  rawProducts.forEach((product, index) => {
    const normalized = normalizeProduct(product, index);
    if (normalized.inStock && grouped[normalized.category]) {
      grouped[normalized.category].push(normalized);
    }
  });

  return {
    figurines: grouped.figurines.length ? grouped.figurines : FALLBACK_PRODUCTS.figurines.map(normalizeFallbackProduct),
    combos: grouped.combos.length ? grouped.combos : FALLBACK_PRODUCTS.combos.map(normalizeFallbackProduct),
    mystery: grouped.mystery.length ? grouped.mystery : FALLBACK_PRODUCTS.mystery.map(normalizeFallbackProduct),
    keychains: grouped.keychains.length ? grouped.keychains : FALLBACK_PRODUCTS.keychains.map(normalizeFallbackProduct),
  };
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
                    <p className="cart-item-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
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
        {products.map((p, i) => (
          <div key={p.id} className="card-animate" style={{ animationDelay: `${i * 0.12}s` }}>
            <div className="card-glow-wrap">
              <ProductCard product={p} currentQty={cart.find(item => item.id === p.id)?.qty || 0} onAdd={onAdd} />
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
  const [inventoryProducts, setInventoryProducts] = useState(FALLBACK_PRODUCTS);

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
          setInventoryProducts(FALLBACK_PRODUCTS);
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
        <button className={`cart-toggle ${cartTotal > 0 ? 'cart-has-items' : ''}`} onClick={() => setCartOpen(true)}>
          <ShoppingCart size={18} />
          {cartTotal > 0 && <span className="cart-badge">{cartTotal}</span>}
        </button>
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
                <button className="btn-primary" onClick={() => scrollTo('figurines')}>
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

          {/* Features */}
          <FeaturesSection />

          {/* Shop Sections */}
          <main id="shop" className="shop-main">
            <Section
              id="figurines"
              icon={<Star size={22} />}
              title="Premium Figurines"
              accent="#800000"
              products={inventoryProducts.figurines}
              onAdd={handleAdd}
              cart={cart}
            />
            <Section
              id="combos"
              icon={<Package size={22} />}
              title="Exclusive Combos"
              accent="#a31a1a"
              products={inventoryProducts.combos}
              onAdd={handleAdd}
              cart={cart}
            />
            <Section
              id="mystery"
              icon={<Sparkles size={22} />}
              title="Mystery Gacha Balls"
              accent="#4d0000"
              products={inventoryProducts.mystery}
              onAdd={handleAdd}
              cart={cart}
            />
            <Section
              id="keychains"
              icon={<KeyRound size={22} />}
              title="Anime Key Chains"
              accent="#660000"
              products={inventoryProducts.keychains}
              onAdd={handleAdd}
              cart={cart}
            />
          </main>
        </>
      ) : (
        <CollectionPage
          inventoryProducts={inventoryProducts}
          onAdd={handleAdd}
          cart={cart}
          onBack={() => navigate('home')}
        />
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
