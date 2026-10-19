import { useState } from 'react';
import { responsiveImage, sizedImage } from '../../utils/images';

export default function ProductGallery({ images = [], title }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-3 md:flex-col">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden border ${
                i === activeIndex ? 'border-accent' : 'border-transparent'
              }`}
            >
              <img src={sizedImage(img, 160)} alt={`${title} thumbnail ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden bg-cream">
        <div className="group relative aspect-square overflow-hidden">
          <img
            {...responsiveImage(images[activeIndex], '(min-width: 768px) 45vw, 100vw', [600, 1000, 1500])}
            alt={title}
            fetchPriority="high"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-125"
          />
        </div>
      </div>
    </div>
  );
}
