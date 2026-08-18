import React, { useRef, useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import ProductCard from './ProductCard';
import ImageWithFallback from './imageUtils';
import { CATEGORIES, ShopByCategory } from './App';

export default function CollectionPage({ inventoryProducts, onAdd, cart, onBack, onView, initialCategory = 'all', recentlyViewed = [], wishlist = [], onToggleWishlist, onShare }) {
    const scrollRef = useRef(null);
    const recentScrollRef = useRef(null);
    const productsRef = useRef(null);
    const featured = (inventoryProducts?.['anime-figures'] || []).slice(0, 4);
    const [activeCategory, setActiveCategory] = useState(initialCategory);

    useEffect(() => {
        if (initialCategory) {
            setActiveCategory(initialCategory);
        }
    }, [initialCategory]);

    const handleSelectCategory = (key) => {
        setActiveCategory(key);
        // Scroll to products grid after a short delay to allow re-render
        setTimeout(() => {
            productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const allProducts = Object.values(inventoryProducts || {}).flat();

    const categories = [
        { key: 'all', label: 'All Products' },
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
                <ShopByCategory onSelectCategory={handleSelectCategory} activeCategory={activeCategory} hideTitle={true} />
                    <h3 ref={productsRef} style={{ marginTop: '1rem' }}>All Products</h3>
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
                                    onShare={onShare}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
