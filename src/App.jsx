import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X, Star, Zap, Package, Sparkles, ChevronDown, Heart, Eye, KeyRound, ShieldCheck, Truck, Gem, Medal } from 'lucide-react';

// ─── Product Data ────────────────────────────────────────────────────────────
const PRODUCTS = {
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
                      <button onClick={() => onUpdateQty(item.id, 1)}>+</button>
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

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b" />
      ))}
      <span>{rating}</span>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const cardRef = useRef(null);

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  // Tilt effect
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-8px)`;
  };
  const handleMouseLeave = () => {
    cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
  };

  return (
    <div
      ref={cardRef}
      className="product-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {product.badge && (
        <span className="product-badge" style={{ background: product.badgeColor }}>{product.badge}</span>
      )}
      <button className={`product-like ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)}>
        <Heart size={16} fill={liked ? '#800000' : 'none'} stroke={liked ? '#800000' : '#800000'} />
      </button>
      <div className="product-img-wrap">
        <img src={product.image} alt={product.title} className="product-img" />
        <div className="product-overlay">
          <Eye size={18} /> Quick View
        </div>
      </div>
      <div className="product-info">
        <p className="product-subtitle">{product.subtitle}</p>
        <h3 className="product-title">{product.title}</h3>
        <Stars rating={product.rating} />
        <p className="product-reviews">{product.reviews} reviews</p>
        <div className="product-footer">
          <span className="product-price">₹{product.price.toLocaleString('en-IN')}</span>
          <button
            className={`btn-add ${added ? 'added' : ''}`}
            onClick={handleAdd}
          >
            {added ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ id, icon, title, accent, products, onAdd }) {
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
              <ProductCard product={p} onAdd={onAdd} />
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAdd = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleRemove = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const handleUpdateQty = (id, delta) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
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
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          AnimeCurio
        </div>
        <nav className="site-nav">
          {[['figurines', 'Figurines'], ['combos', 'Combos'], ['mystery', 'Mystery Balls'], ['keychains', 'Key Chains']].map(([id, label]) => (
            <button key={id} className="nav-link" onClick={() => scrollTo(id)}>{label}</button>
          ))}
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

      {/* Hero */}
      <section className="hero">
        <div
          className="hero-bg"
          style={{
            backgroundImage: `url('file:///C:/Users/yoshi/.gemini/antigravity/brain/f103db67-39c4-4ffe-9824-d140ca94324a/anime_hero_banner_1783577788688.png')`
          }}
        />
        <div className="hero-glow glow-pink" />
        <div className="hero-glow glow-cyan" />
        <div className="hero-content">
          <div className="hero-tag"><Sparkles size={14} /> New 2026 Collection</div>
          <h1 className="hero-title">
            Elevate Your<br />
            <span className="hero-accent">Anime Collection</span>
          </h1>
          <p className="hero-desc">
            Discover highly detailed figurines, curated combo boxes, and rare mystery gacha balls.
            Premium merchandise crafted for true enthusiasts.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => scrollTo('figurines')}>
              <Zap size={16} /> Shop Now
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

      {/* Stats */}
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
          products={PRODUCTS.figurines}
          onAdd={handleAdd}
        />
        <Section
          id="combos"
          icon={<Package size={22} />}
          title="Exclusive Combos"
          accent="#a31a1a"
          products={PRODUCTS.combos}
          onAdd={handleAdd}
        />
        <Section
          id="mystery"
          icon={<Sparkles size={22} />}
          title="Mystery Gacha Balls"
          accent="#4d0000"
          products={PRODUCTS.mystery}
          onAdd={handleAdd}
        />
        <Section
          id="keychains"
          icon={<KeyRound size={22} />}
          title="Anime Key Chains"
          accent="#660000"
          products={PRODUCTS.keychains}
          onAdd={handleAdd}
        />
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-logo">AnimeCurio</div>
        <p className="footer-copy">© 2026 AnimeCurio. All rights reserved. | Made with ❤️ in India</p>
        <p className="footer-sub">Proudly serving anime fans across Bharat 🇮🇳</p>
      </footer>
    </div>
  );
}
