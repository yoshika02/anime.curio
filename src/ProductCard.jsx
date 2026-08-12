import React, { useEffect, useState } from 'react';
import { ShoppingCart, Eye, Star, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import ImageWithFallback from './imageUtils';

function Stars({ rating }) {
    return (
        <div className="stars">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={11}
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

    const prevImage = (e) => {
        e.stopPropagation();
        setActiveView((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setActiveView((prev) => (prev + 1) % galleryItems.length);
    };

    return (
        <div className="product-card" onClick={() => onView?.(product)}>

            {/* ── Image area ── */}
            <div className="product-img-wrap">
                <ImageWithFallback
                    src={activeImage}
                    alt={`${product.title} ${galleryItems[activeView]?.label || ''}`}
                    className="product-img"
                    fallbackImage={fallbackImage}
                />

                {/* Gallery arrows */}
                {galleryItems.length > 1 && (
                    <>
                        <button type="button" className="product-nav product-nav-left" onClick={prevImage} onMouseDown={(e) => e.stopPropagation()}>
                            <ChevronLeft size={18} />
                        </button>
                        <button type="button" className="product-nav product-nav-right" onClick={nextImage} onMouseDown={(e) => e.stopPropagation()}>
                            <ChevronRight size={18} />
                        </button>
                        <div className="product-view-switcher" onClick={(e) => e.stopPropagation()}>
                            {galleryItems.map((item, index) => (
                                <button
                                    key={`${item.label}-${index}`}
                                    type="button"
                                    className={`product-view-dot ${index === activeView ? 'active' : ''}`}
                                    onClick={() => setActiveView(index)}
                                    aria-label={item.label}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Badges overlaid on image — bottom corners */}
                <div className="pc-badge-row">
                    {product.scale && (
                        <span className="pc-size-badge">{product.scale}</span>
                    )}
                    {product.badge && (
                        <span className="pc-status-badge" style={{ background: product.badgeColor || '#f59e0b' }}>
                            {product.badge}
                        </span>
                    )}
                </div>

                {/* Quick view overlay */}
                <div className="product-overlay">
                    <Eye size={16} /> Quick View
                </div>
            </div>

            {/* ── Card body ── */}
            <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <Stars rating={product.rating} />

                {/* Size & Price row */}
                <div className="pc-meta-row">
                    <span className="pc-size-text">Size: {product.scale}</span>
                    <span className="pc-price-text">
                        <span className="currency-symbol">₹</span>{product.price.toLocaleString('en-IN')}
                    </span>
                </div>

                {/* MRP / discount */}
                {product.actualPrice > product.price && (
                    <div className="pc-mrp-row">
                        <span className="product-mrp-label">M.R.P:</span>
                        <span className="product-price-old">₹{product.actualPrice.toLocaleString('en-IN')}</span>
                        {product.discountPercent > 0 && (
                            <span className="product-discount">({product.discountPercent}% off)</span>
                        )}
                    </div>
                )}

                {/* Buttons */}
                <div className="pc-btn-group">
                    <button
                        type="button"
                        className={`pc-add-btn ${added ? 'added' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                        disabled={!inStock || maxReached}
                    >
                        <ShoppingCart size={15} />
                        {!inStock ? 'Sold Out' : maxReached ? 'Max Added' : added ? '✓ Added!' : 'Add to Cart'}
                    </button>
                    <button
                        type="button"
                        className="pc-details-btn"
                        onClick={(e) => { e.stopPropagation(); onView?.(product); }}
                    >
                        Details
                    </button>
                </div>
            </div>
        </div>
    );
}
