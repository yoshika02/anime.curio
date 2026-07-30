import React, { useState, useRef } from 'react';
import { Heart, Eye, Star } from 'lucide-react';

function Stars({ rating }) {
    return (
        <div className="stars">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={12}
                    fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
                    stroke="#f59e0b"
                />
            ))}
            <span>{rating}</span>
        </div>
    );
}

export default function ProductCard({ product, onAdd, currentQty = 0 }) {
    const resolveImage = (url) => {
        if (!url) return '/products/placeholder.png';
        const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (driveMatch) return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
        return url;
    };
    const [added, setAdded] = useState(false);
    const [liked, setLiked] = useState(false);
    const cardRef = useRef(null);
    const available = product.stockQuantity ?? product.stock ?? 0;
    const inStock = product.inStock !== undefined ? product.inStock : available > 0;
    const maxReached = currentQty >= available;

    const handleAdd = () => {
        if (!inStock || maxReached) return;
        onAdd(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

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
                <span className="product-badge" style={{ background: product.badgeColor }}>
                    {product.badge}
                </span>
            )}
            <button className={`product-like ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)}>
                <Heart size={16} fill={liked ? '#800000' : 'none'} stroke={liked ? '#800000' : '#800000'} />
            </button>
            <div className="product-img-wrap">
                <img src={resolveImage(product.image)} alt={product.title} className="product-img" />
                <div className="product-overlay">
                    <Eye size={18} /> Quick View
                </div>
            </div>
            <div className="product-info">
                <p className="product-subtitle">{product.subtitle}</p>
                <h3 className="product-title">{product.title}</h3>
                {product.scale && <p className="product-scale">Scale: {product.scale}</p>}
                <Stars rating={product.rating} />
                <p className="product-reviews">{product.reviews} reviews</p>
                {product.features?.length > 0 && (
                    <div className="product-features">
                        {product.features.slice(0, 3).map((feature, index) => (
                            <span key={index} className="product-feature">
                                {feature}
                            </span>
                        ))}
                    </div>
                )}
                <div className="product-footer">
                    <span className="product-price">₹{product.price.toLocaleString('en-IN')}</span>
                    <button
                        type="button"
                        className={`btn-add ${added ? 'added' : ''}`}
                        onClick={handleAdd}
                        disabled={!inStock || maxReached}
                    >
                        {!inStock ? 'Sold Out' : maxReached ? 'Max Added' : added ? '✓ Added' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
}
