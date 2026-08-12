import React, { useRef, useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import ProductCard from './ProductCard';
import ImageWithFallback from './imageUtils';
import { CATEGORIES } from './App';

export default function CollectionPage({ inventoryProducts, onAdd, cart, onBack, onView, initialCategory = 'all', recentlyViewed = [], wishlist = [], onToggleWishlist }) {
    const scrollRef = useRef(null);
    const recentScrollRef = useRef(null);
    const featured = (inventoryProducts?.['anime-figures'] || []).slice(0, 4);
    const [activeCategory, setActiveCategory] = useState(initialCategory);

    useEffect(() => {
        if (initialCategory) {
            setActiveCategory(initialCategory);
        }
    }, [initialCategory]);

    const allProducts = Object.values(inventoryProducts || {}).flat();

    const categories = [
        { key: 'all', label: 'All Products' },
        { key: 'new', label: '✨ New Arrivals' },
        ...CATEGORIES
    ];

    const visibleProducts = activeCategory === 'all'
        ? allProducts
        : activeCategory === 'new'
            ? allProducts.filter(p => p.isNew)
            : allProducts.filter(p => p.category === activeCategory);

    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const interval = setInterval(() => {
            const el = scrollRef.current;
            if (!el) return;
            const maxScroll = el.scrollWidth - el.clientWidth;
            if (el.scrollLeft >= maxScroll - 10) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: 320, behavior: 'smooth' });
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [featured, paused]);

    const scrollCarousel = (direction) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: direction * 320, behavior: 'smooth' });
    };

    return (
        <main className="collection-page">
            <div className="collection-page-header">
                <div>
                    <h2 className="collection-title">
                        {activeCategory === 'all' ? '🔥 New Arrivals & Top Collectibles' : 'Top Collectibles'}
                    </h2>
                    <p className="collection-copy">
                        Discover newly landed anime figures and trending merchandise front and center.
                    </p>
                </div>
                <div className="collection-carousel-wrap">
                    <button type="button" className="carousel-arrow left" onClick={() => scrollCarousel(-1)}>
                        ‹
                    </button>
                    <div 
                        className="collection-carousel" 
                        ref={scrollRef}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                    >
                        {featured.map((item, idx) => (
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
                                        onClick={() => onView?.(item)}
                                        style={{ cursor: 'pointer', position: 'relative', border: 'none' }}
                                    >
                                        <button 
                                            className={`wishlist-btn ${wishlist.find(p => p.id === item.id) ? 'active' : ''}`}
                                            style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 10 }}
                                            onClick={(e) => { e.stopPropagation(); onToggleWishlist(item); }}
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
                    <button type="button" className="carousel-arrow right" onClick={() => scrollCarousel(1)}>
                        ›
                    </button>
                </div>
            </div>

            {/* Recently Viewed Products Section */}
            {recentlyViewed.length > 0 && (
                <section className="recently-viewed-section" style={{ margin: '1.5rem 0', background: '#fff', border: '1px solid var(--bg3)', borderRadius: '20px', padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--maroon)', margin: 0, fontWeight: '800' }}>
                            👀 Recently Viewed Items
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quick re-visit</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {recentlyViewed.map(item => (
                            <div
                                key={`recent-${item.id}`}
                                onClick={() => onView?.(item)}
                                style={{ flex: '0 0 140px', background: 'var(--bg2)', border: '1px solid var(--bg3)', borderRadius: '14px', padding: '0.6rem', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}
                            >
                                <ImageWithFallback src={item.image} alt={item.title} style={{ width: '100%', height: '90px', objectFit: 'contain', borderRadius: '8px' }} />
                                <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text)', margin: '0.4rem 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--maroon)', fontWeight: 'bold' }}>₹{item.price.toLocaleString('en-IN')}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="collection-all-products">
                <div className="collection-all-header">
                    <div className="pill-nav">
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                type="button"
                                className={`pill ${activeCategory === cat.key ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.key)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <h3>All Products</h3>
                </div>
                <div className="product-grid collection-products-grid">
                    {visibleProducts.length === 0 ? (
                        <div className="empty-state">No products available yet.</div>
                    ) : visibleProducts.map((product, index) => (
                        <div key={`${product.id}-${index}`} className="card-animate" style={{ animationDelay: `${index * 0.08}s` }}>
                            <div className="card-glow-wrap">
                                <ProductCard 
                                    product={product} 
                                    currentQty={cart.find((item) => item.id === product.id)?.qty || 0} 
                                    onAdd={onAdd} 
                                    onView={onView} 
                                    wishlist={wishlist}
                                    onToggleWishlist={onToggleWishlist}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
