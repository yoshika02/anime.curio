import React, { useRef } from 'react';
import ProductCard from './ProductCard';

export default function CollectionPage({ inventoryProducts, onAdd, cart, onBack }) {
    const scrollRef = useRef(null);
    const featured = inventoryProducts.figurines.slice(0, 4);
    const allProducts = [
        ...inventoryProducts.figurines,
        ...inventoryProducts.combos,
        ...inventoryProducts.mystery,
        ...inventoryProducts.keychains,
    ];

    const scrollCarousel = (direction) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: direction * 300, behavior: 'smooth' });
    };

    return (
        <main className="collection-page">
            <div className="collection-page-header">
                <div>
                    <button type="button" className="collection-back" onClick={onBack}>
                        ← Back to Home
                    </button>
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
                                <img src={item.image} alt={item.title} className="carousel-image" />
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
                    <h3>All Products</h3>
                </div>
                <div className="product-grid collection-products-grid">
                    {allProducts.map((product, index) => (
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
