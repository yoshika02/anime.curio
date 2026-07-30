import React, { useRef, useState } from 'react';
import ProductCard from './ProductCard';

export default function CollectionPage({ inventoryProducts, onAdd, cart, onBack }) {
    const scrollRef = useRef(null);
    const convertDriveUrl = (rawValue) => {
        const fallbackImage = '/Phone_portrait_old.png';
        if (!rawValue && rawValue !== 0) return fallbackImage;
        let image = typeof rawValue === 'string' ? rawValue.trim() : rawValue?.url || rawValue?.src || rawValue?.value || rawValue?.text || '';
        if (typeof image !== 'string') image = String(image);
        image = image.trim();

        const imageFormula = image.match(/(?:^=)?IMAGE\(['"]([^'"]+)['"]/i);
        if (imageFormula) image = imageFormula[1];

        const hyperlinkFormula = image.match(/(?:^=)?HYPERLINK\(['"]([^'"]+)['"]\s*,?/i);
        if (hyperlinkFormula) image = hyperlinkFormula[1];

        const driveMatch = image.match(/(?:https?:\/\/)?drive\.google\.com\/.*(?:\/d\/|id=)([a-zA-Z0-9_-]+)/i);
        if (driveMatch) return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
        return image || fallbackImage;
    };
    const featured = inventoryProducts.figurines.slice(0, 4);
    const [activeCategory, setActiveCategory] = useState('all');
    const allProducts = [
        ...inventoryProducts.figurines,
        ...inventoryProducts.combos,
        ...inventoryProducts.mystery,
        ...inventoryProducts.keychains,
    ];

    const categories = [
        { key: 'all', label: 'All Products' },
        { key: 'figurines', label: '1. Anime Figurines' },
        { key: 'combos', label: '2. Combo Packs' },
        { key: 'mystery', label: '3. Mystery Balls' },
        { key: 'keychains', label: '4. Key Chains' },
    ];

    const visibleProducts = activeCategory === 'all'
        ? allProducts
        : allProducts.filter(p => p.category === activeCategory);

    const scrollCarousel = (direction) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: direction * 300, behavior: 'smooth' });
    };

    return (
        <main className="collection-page">
            <div className="collection-page-header">
                <div>
                    <h2 className="collection-title">Top Collectibles</h2>
                    <p className="collection-copy">
                        Browse the latest premium figures front and center, then explore every product in the collection.
                    </p>
                </div>
                <div className="collection-carousel-wrap">
                    <button type="button" className="carousel-arrow left" onClick={() => scrollCarousel(-1)}>
                        ‹
                    </button>
                    <div className="collection-carousel" ref={scrollRef}>
                        {featured.map((item) => (
                            <div key={item.id} className="carousel-card">
                                <img src={convertDriveUrl(item.image)} alt={item.title} className="carousel-image" />
                                <div className="carousel-meta">
                                    <span className="carousel-name">{item.title}</span>
                                    <span className="carousel-price">₹{item.price.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" className="carousel-arrow right" onClick={() => scrollCarousel(1)}>
                        ›
                    </button>
                </div>
            </div>

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
                                <ProductCard product={product} currentQty={cart.find((item) => item.id === product.id)?.qty || 0} onAdd={onAdd} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
