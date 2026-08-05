import React, { useEffect, useState, useRef } from 'react';
import { Heart, Eye, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageWithFallback from './imageUtils';

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

export default function ProductCard({ product, onAdd, onView, currentQty = 0 }) {
    const fallbackImage = '/placeholder.svg';
    const [added, setAdded] = useState(false);
    const [liked, setLiked] = useState(false);
    const [activeView, setActiveView] = useState(0);
    const available = product.stockQuantity ?? product.stock ?? 0;
    const inStock = product.inStock !== undefined ? product.inStock : available > 0;
    const maxReached = currentQty >= available;
    const galleryItems = Array.isArray(product.galleryImages) && product.galleryImages.length > 0
        ? product.galleryImages
        : [{ url: product.image || fallbackImage, label: 'Main' }];
    const activeImage = galleryItems[activeView]?.url || fallbackImage;

    useEffect(() => {
        setActiveView(0);
    }, [product.id]);

    const handleAdd = () => {
        if (!inStock || maxReached) return;
        onAdd(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

    const prevImage = (event) => {
        event.stopPropagation();
        setActiveView((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
    };

    const nextImage = (event) => {
        event.stopPropagation();
        setActiveView((prev) => (prev + 1) % galleryItems.length);
    };

    return (
        <div
            className="product-card"
            onClick={() => onView?.(product)}
        >
            <div className="product-card-top-row">
                <div className="product-badges-group">
                    {product.scale && <span className="product-scale-badge">{product.scale}</span>}
                    {product.badge && (
                        <span className="product-badge-item" style={{ background: product.badgeColor }}>
                            {product.badge}
                        </span>
                    )}
                    {product.stockQuantity !== undefined && (
                        <span className={`product-stock-badge ${product.inStock ? 'in-stock' : 'sold-out'}`}>
                            {product.inStock ? `Stock: ${product.stockQuantity}` : 'Sold Out'}
                        </span>
                    )}
                </div>
            </div>
            <button className={`product-like ${liked ? 'liked' : ''}`} onClick={(event) => { event.stopPropagation(); setLiked(!liked); }}>
                <Heart size={16} fill={liked ? '#800000' : 'none'} stroke={liked ? '#800000' : '#800000'} />
            </button>
            <div className="product-img-wrap">
                <ImageWithFallback src={activeImage} alt={`${product.title} ${galleryItems[activeView]?.label || ''}`} className="product-img" fallbackImage={fallbackImage} />
                {galleryItems.length > 1 && (
                    <>
                        <button type="button" className="product-nav product-nav-left" onClick={prevImage} onMouseDown={(e) => e.stopPropagation()}>
                            <ChevronLeft size={20} />
                        </button>
                        <button type="button" className="product-nav product-nav-right" onClick={nextImage} onMouseDown={(e) => e.stopPropagation()}>
                            <ChevronRight size={20} />
                        </button>
                        <div className="product-view-switcher" onClick={(event) => event.stopPropagation()}>
                            {galleryItems.map((item, index) => (
                                <button
                                    key={`${item.label}-${index}`}
                                    type="button"
                                    className={`product-view-btn ${index === activeView ? 'active' : ''}`}
                                    onClick={() => setActiveView(index)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
                <div className="product-overlay">
                    <Eye size={18} /> Quick View
                </div>
            </div>
            <div className="product-info">
                {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}
                <h3 className="product-title">{product.title}</h3>
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
                    <div className="product-price-group">
                        <span className="product-price"><span className="currency-symbol">₹</span>{product.price.toLocaleString('en-IN')}</span>
                        {product.actualPrice > product.price && (
                            <span className="product-mrp-group">
                                <span className="product-mrp-label">M.R.P:</span>
                                <span className="product-price-old">₹{product.actualPrice.toLocaleString('en-IN')}</span>
                                {product.discountPercent > 0 && <span className="product-discount">({product.discountPercent}% off)</span>}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        className={`btn-add ${added ? 'added' : ''}`}
                        onClick={(event) => { event.stopPropagation(); handleAdd(); }}
                        disabled={!inStock || maxReached}
                    >
                        {!inStock ? 'Sold Out' : maxReached ? 'Max Added' : added ? '✓ Added' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
}
