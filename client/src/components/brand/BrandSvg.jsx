import { forwardRef } from 'react';
import markSvg from '../../assets/brand/hadorn-mark.svg?raw';
import wordmarkSvg from '../../assets/brand/hadorn-wordmark.svg?raw';
import wordmarkStudioSvg from '../../assets/brand/hadorn-wordmark-studio.svg?raw';

const SVGS = { mark: markSvg, wordmark: wordmarkSvg, studio: wordmarkStudioSvg };

// Inlined (not <img>) so individual letters/paths can be animated; colour comes from CSS `color`.
// Sources are our own bundled brand files, never user input.
const BrandSvg = forwardRef(function BrandSvg({ name, className = '', ...props }, ref) {
  return (
    <span
      ref={ref}
      className={`brand-svg block ${className}`}
      dangerouslySetInnerHTML={{ __html: SVGS[name] }}
      {...props}
    />
  );
});

export default BrandSvg;
