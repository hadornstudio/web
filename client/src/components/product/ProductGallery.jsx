import { useState } from 'react';

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
              <img src={img} alt={`${title} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden bg-cream">
        <div className="group relative aspect-square overflow-hidden">
          <img
            src={images[activeIndex]}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-125"
          />
        </div>
      </div>
    </div>
  );
}
