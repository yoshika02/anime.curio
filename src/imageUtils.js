import React, { useEffect, useState } from 'react';

const DEFAULT_FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="%23fff5f6" stroke="%23800000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" ry="3" fill="%23fff5f6"/><circle cx="8.5" cy="8.5" r="1.5" fill="%23800000"/><path d="M21 15l-5-5L5 21" stroke="%23800000"/></svg>';

export function getImageCandidates(rawValue, fallbackImage = DEFAULT_FALLBACK_IMAGE) {
    if (!rawValue && rawValue !== 0) return [fallbackImage];

    let image = typeof rawValue === 'string' ? rawValue.trim() : rawValue?.url || rawValue?.src || rawValue?.value || rawValue?.text || '';
    if (typeof image !== 'string') image = String(image);
    image = image.trim();

    if (!image) return [fallbackImage];

    const imageFormula = image.match(/(?:^=)?IMAGE\(['"]([^'"]+)['"]/i);
    if (imageFormula) image = imageFormula[1];

    const hyperlinkFormula = image.match(/(?:^=)?HYPERLINK\(['"]([^'"]+)['"]\s*,?/i);
    if (hyperlinkFormula) image = hyperlinkFormula[1];

    const driveMatch = image.match(/(?:https?:\/\/)?drive\.google\.com\/(?:file\/d\/|drive\/u\/\d+\/folders\/|.*?\/d\/|.*?[?&]id=)([a-zA-Z0-9_-]+)/i)
        || image.match(/(?:https?:\/\/)?drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);

    if (driveMatch) {
        const id = driveMatch[1];
        return [
            `https://lh3.googleusercontent.com/d/${id}=s1000`,
            `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
            `https://drive.google.com/uc?export=view&id=${id}`,
            fallbackImage,
        ];
    }

    if (image.startsWith('data:image')) return [image, fallbackImage];
    return [image || fallbackImage, fallbackImage];
}

export function getPrimaryImageUrl(rawValue, fallbackImage = DEFAULT_FALLBACK_IMAGE) {
    return getImageCandidates(rawValue, fallbackImage)[0];
}

export default function ImageWithFallback({ src, alt, className, fallbackImage = DEFAULT_FALLBACK_IMAGE, ...props }) {
    const [currentSrc, setCurrentSrc] = useState(() => getPrimaryImageUrl(src, fallbackImage));
    const [candidateIndex, setCandidateIndex] = useState(0);

    useEffect(() => {
        setCurrentSrc(getPrimaryImageUrl(src, fallbackImage));
        setCandidateIndex(0);
    }, [src, fallbackImage]);

    const handleError = () => {
        const candidates = getImageCandidates(src, fallbackImage);
        if (candidateIndex < candidates.length - 1) {
            const nextIndex = candidateIndex + 1;
            setCandidateIndex(nextIndex);
            setCurrentSrc(candidates[nextIndex]);
        } else {
            setCurrentSrc(fallbackImage);
        }
    };

    return React.createElement('img', {
        src: currentSrc,
        alt,
        className,
        onError: handleError,
        loading: 'lazy',
        ...props,
    });
}
