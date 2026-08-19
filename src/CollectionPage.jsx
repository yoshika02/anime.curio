import React, { useRef, useState, useEffect } from 'react';
import { Heart, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from './ProductCard';
import ImageWithFallback from './imageUtils';
import { CATEGORIES, ShopByCategory } from './App';

// ─── Filter & Sort Bar ────────────────────────────────────────────────────────
function FilterSortBar({ filters, onChange, onClear, totalCount, filteredCount }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const activeCount = [
        filters.sort !== 'newest',
        filters.priceRange !== 'all',
        filters.inStockOnly,
        filters.onSaleOnly,
    ].filter(Boolean).length;

    const SortButton = ({ value, label }) => (
        <button
            onClick={() => onChange('sort', value)}
            style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '20px',
                border: `1px solid ${filters.sort === value ? 'var(--maroon)' : 'var(--bg3)'}`,
                background: filters.sort === value ? 'var(--maroon)' : '#fff',
                color: filters.sort === value ? '#fff' : 'var(--text)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
            }}
        >
            {label}
        </button>
    );

    const PriceButton = ({ value, label }) => (
        <button
            onClick={() => onChange('priceRange', filters.priceRange === value ? 'all' : value)}
            style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '20px',
                border: `1px solid ${filters.priceRange === value ? 'var(--maroon)' : 'var(--bg3)'}`,
                background: filters.priceRange === value ? 'var(--maroon)' : '#fff',
                color: filters.priceRange === value ? '#fff' : 'var(--text)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
            }}
        >
            {label}
        </button>
    );

    const ToggleChip = ({ field, label, emoji }) => (
        <button
            onClick={() => onChange(field, !filters[field])}
            style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '20px',
                border: `1px solid ${filters[field] ? 'var(--maroon)' : 'var(--bg3)'}`,
                background: filters[field] ? 'var(--maroon-pale)' : '#fff',
                color: filters[field] ? 'var(--maroon)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
            }}
        >
            <span>{emoji}</span> {label}
        </button>
    );

    const barContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Row 1: Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '36px' }}>Sort</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <SortButton value="newest" label="🆕 Newest" />
                    <SortButton value="price-asc" label="₹ Low → High" />
                    <SortButton value="price-desc" label="₹ High → Low" />
                    <SortButton value="discount" label="🔥 Most Discount" />
                    <SortButton value="name-asc" label="A → Z" />
                </div>
            </div>

            {/* Row 2: Price + Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '36px' }}>Filter</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <PriceButton value="under500" label="Under ₹500" />
                    <PriceButton value="500-1000" label="₹500 – ₹1000" />
                    <PriceButton value="above1000" label="₹1000+" />
                    <ToggleChip field="inStockOnly" label="In Stock" emoji="✅" />
                    <ToggleChip field="onSaleOnly" label="On Sale" emoji="🏷️" />
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ background: '#fff', border: '1px solid var(--bg3)', borderRadius: '16px', padding: '0.85rem 1rem', marginBottom: '0.25rem' }}>
            {/* Desktop: always visible */}
            <div className="filter-bar-desktop">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <SlidersHorizontal size={16} color="var(--maroon)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--maroon)' }}>Filter & Sort</span>
                        {activeCount > 0 && (
                            <span style={{ background: 'var(--maroon)', color: '#fff', borderRadius: '999px', padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>
                                {activeCount} active
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {filteredCount === totalCount ? `${totalCount} products` : `${filteredCount} of ${totalCount} products`}
                        </span>
                        {activeCount > 0 && (
                            <button
                                onClick={onClear}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'var(--maroon)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '8px', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--maroon-pale)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <X size={13} /> Clear all
                            </button>
                        )}
                    </div>
                </div>
                {barContent}
            </div>

            {/* Mobile: collapsible */}
            <div className="filter-bar-mobile">
                <button
                    onClick={() => setMobileOpen(o => !o)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <SlidersHorizontal size={16} color="var(--maroon)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--maroon)' }}>Filter & Sort</span>
                        {activeCount > 0 && (
                            <span style={{ background: 'var(--maroon)', color: '#fff', borderRadius: '999px', padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>
                                {activeCount}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{filteredCount} products</span>
                        {mobileOpen ? <ChevronUp size={16} color="var(--maroon)" /> : <ChevronDown size={16} color="var(--maroon)" />}
                    </div>
                </button>
                {mobileOpen && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--bg3)' }}>
                        {barContent}
                        {activeCount > 0 && (
                            <button
                                onClick={() => { onClear(); setMobileOpen(false); }}
                                style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--maroon-pale)', border: '1px solid var(--maroon)', color: 'var(--maroon)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: '0.45rem 0.9rem', borderRadius: '10px' }}
                            >
                                <X size={13} /> Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Collection Page ─────────────────────────────────────────────────────
export default function CollectionPage({ inventoryProducts, onAdd, cart, onBack, onView, initialCategory = 'all', recentlyViewed = [], wishlist = [], onToggleWishlist, onShare }) {
    const scrollRef = useRef(null);
    const recentScrollRef = useRef(null);
    const productsRef = useRef(null);
    const featured = (inventoryProducts?.['anime-figures'] || []).slice(0, 4);
    const [activeCategory, setActiveCategory] = useState(initialCategory);

    // ── Filter & Sort state ──────────────────────────────────────────────────
    const defaultFilters = { sort: 'newest', priceRange: 'all', inStockOnly: false, onSaleOnly: false };
    const [filters, setFilters] = useState(defaultFilters);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => setFilters(defaultFilters);

    useEffect(() => {
        if (initialCategory) {
            setActiveCategory(initialCategory);
        }
    }, [initialCategory]);

    const handleSelectCategory = (key) => {
        setActiveCategory(key);
        setTimeout(() => {
            productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const allProducts = Object.values(inventoryProducts || {}).flat();

    const categories = [
        { key: 'all', label: 'All Products' },
        ...CATEGORIES
    ];

    // ── Apply category filter ────────────────────────────────────────────────
    let visibleProducts = activeCategory === 'all'
        ? allProducts
        : activeCategory === 'new'
            ? allProducts.filter(p => p.isNew)
            : allProducts.filter(p => p.category === activeCategory);

    // ── Apply price range ────────────────────────────────────────────────────
    if (filters.priceRange === 'under500') {
        visibleProducts = visibleProducts.filter(p => p.price < 500);
    } else if (filters.priceRange === '500-1000') {
        visibleProducts = visibleProducts.filter(p => p.price >= 500 && p.price <= 1000);
    } else if (filters.priceRange === 'above1000') {
        visibleProducts = visibleProducts.filter(p => p.price > 1000);
    }

    // ── Apply in-stock toggle ────────────────────────────────────────────────
    if (filters.inStockOnly) {
        visibleProducts = visibleProducts.filter(p => p.inStock);
    }

    // ── Apply on-sale toggle ─────────────────────────────────────────────────
    if (filters.onSaleOnly) {
        visibleProducts = visibleProducts.filter(p => p.discountPercent > 0);
    }

    // ── Apply sort ───────────────────────────────────────────────────────────
    visibleProducts = [...visibleProducts];
    if (filters.sort === 'price-asc') {
        visibleProducts.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price-desc') {
        visibleProducts.sort((a, b) => b.price - a.price);
    } else if (filters.sort === 'discount') {
        visibleProducts.sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (filters.sort === 'name-asc') {
        visibleProducts.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'newest' — keep natural order (inventory order, newest added last → reverse)
    else if (filters.sort === 'newest') {
        visibleProducts.sort((a, b) => b.id - a.id);
    }

    const baseCount = activeCategory === 'all'
        ? allProducts.length
        : activeCategory === 'new'
            ? allProducts.filter(p => p.isNew).length
            : allProducts.filter(p => p.category === activeCategory).length;

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
                    {/* Category pills */}
                    <ShopByCategory onSelectCategory={handleSelectCategory} activeCategory={activeCategory} hideTitle={true} />

                    {/* Filter & Sort bar */}
                    <div ref={productsRef} style={{ marginTop: '1rem' }}>
                        <FilterSortBar
                            filters={filters}
                            onChange={handleFilterChange}
                            onClear={clearFilters}
                            totalCount={baseCount}
                            filteredCount={visibleProducts.length}
                        />
                    </div>
                </div>

                {/* Empty state when filters zero out results */}
                {visibleProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.4rem' }}>No products match your filters</div>
                        <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Try adjusting the price range, sort, or remove a toggle.</div>
                        <button
                            onClick={clearFilters}
                            style={{ background: 'var(--maroon)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.6rem 1.4rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="product-grid collection-products-grid">
                        {visibleProducts.map((product, index) => (
                            <div key={`${product.id}-${index}`} className="card-animate" style={{ animationDelay: `${index * 0.04}s` }}>
                                <div className="card-glow-wrap">
                                    <ProductCard
                                        product={product}
                                        currentQty={cart.find((item) => item.id === product.id)?.qty || 0}
                                        onAdd={onAdd}
                                        onView={onView}
                                        wishlist={wishlist}
                                        onToggleWishlist={onToggleWishlist}
                                        onShare={onShare}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
