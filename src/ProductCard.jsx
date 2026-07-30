import React, { useEffect, useState, useRef } from 'react';
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
    const fallbackImage = '/placeholder.svg';
    const resolveImage = (rawValue) => {
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
    const [added, setAdded] = useState(false);
    const [liked, setLiked] = useState(false);
    const [imgSrc, setImgSrc] = useState(() => resolveImage(product.image));
    const cardRef = useRef(null);
    const available = product.stockQuantity ?? product.stock ?? 0;
    const inStock = product.inStock !== undefined ? product.inStock : available > 0;
    const maxReached = currentQty >= available;

    useEffect(() => {
        setImgSrc(resolveImage(product.image));
    }, [product.image]);

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
                <img src={imgSrc} alt={product.title} className="product-img" onError={() => setImgSrc(fallbackImage)} />
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
