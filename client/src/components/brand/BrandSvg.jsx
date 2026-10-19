import { forwardRef } from 'react';
import markSvg from '../../assets/brand/hadorn-mark.svg?raw';
import wordmarkSvg from '../../assets/brand/hadorn-wordmark.svg?raw';
import wordmarkStudioSvg from '../../assets/brand/hadorn-wordmark-studio.svg?raw';

// The files carry their own <title>/role/aria-label; the surrounding link or heading provides the name,
// so strip them (otherwise screen readers read the logo twice and label checks fail).
const clean = (svg) => svg.replace(/<title>[\s\S]*?<\/title>/, '').replace(/\s(role|aria-label)="[^"]*"/g, '');
const SVGS = { mark: clean(markSvg), wordmark: clean(wordmarkSvg), studio: clean(wordmarkStudioSvg) };

// Inlined (not <img>) so individual letters/paths can be animated; colour comes from CSS `color`.
// Sources are our own bundled brand files, never user input.
const BrandSvg = forwardRef(function BrandSvg({ name, className = '', ...props }, ref) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`brand-svg block ${className}`}
      dangerouslySetInnerHTML={{ __html: SVGS[name] }}
      {...props}
    />
  );
});

export default BrandSvg;
