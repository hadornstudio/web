import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/motion/gsapConfig';
import { defaultOption } from '../../utils/configurator';

// Pushes the customer's selection onto the loaded glTF: material parts recolour a named material,
// scale parts resize the model, add-ons fade a named material in or out.
function applySelection(viewer, config, selection, originals) {
  const model = viewer.model;
  if (!model) return;
  const material = (name) => model.materials.find((m) => m.name === name);

  for (const part of config.parts) {
    const option = part.options.find((o) => o.id === selection.options[part.id]) || defaultOption(part);
    if (part.type === 'scale') {
      viewer.scale = `${option.scale} ${option.scale} ${option.scale}`;
      continue;
    }
    const mat = material(part.material);
    if (!mat) continue;
    const pbr = mat.pbrMetallicRoughness;
    pbr.setBaseColorFactor(option.color);
    if (option.metallic != null) pbr.setMetallicFactor(option.metallic);
    if (option.roughness != null) pbr.setRoughnessFactor(option.roughness);
  }

  for (const addon of config.addons) {
    const mat = material(addon.material);
    const original = originals.get(addon.material);
    if (!mat || !original) continue;
    const on = selection.addons.includes(addon.id);
    mat.setAlphaMode(on ? 'OPAQUE' : 'BLEND');
    mat.pbrMetallicRoughness.setBaseColorFactor(on ? original : [original[0], original[1], original[2], 0]);
  }
}

const ProductViewer3D = forwardRef(function ProductViewer3D({ product, selection, onUnavailable }, ref) {
  const config = product.configurator;
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const originalsRef = useRef(new Map());
  const [visible, setVisible] = useState(false);
  const [defined, setDefined] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Lazy: only start fetching the viewer library/model once the canvas nears the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    import('@google/model-viewer')
      .then(() => !cancelled && setDefined(true))
      .catch(() => onUnavailable?.());
    return () => {
      cancelled = true;
    };
  }, [visible, onUnavailable]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!defined || !viewer) return undefined;

    const onLoad = () => {
      originalsRef.current = new Map(
        viewer.model.materials.map((m) => [m.name, [...m.pbrMetallicRoughness.baseColorFactor]])
      );
      setLoaded(true);
    };
    const onError = () => onUnavailable?.();
    const onCamera = (e) => {
      if (e.detail?.source === 'user-interaction') viewer.autoRotate = false;
    };
    viewer.addEventListener('load', onLoad);
    viewer.addEventListener('error', onError);
    viewer.addEventListener('camera-change', onCamera);
    return () => {
      viewer.removeEventListener('load', onLoad);
      viewer.removeEventListener('error', onError);
      viewer.removeEventListener('camera-change', onCamera);
    };
  }, [defined, onUnavailable]);

  useEffect(() => {
    if (loaded) applySelection(viewerRef.current, config, selection, originalsRef.current);
  }, [loaded, config, selection]);

  useImperativeHandle(ref, () => ({
    // Small JPEG data URL of the configured model, used as the cart thumbnail.
    async snapshot(size = 320) {
      const viewer = viewerRef.current;
      if (!viewer || !loaded) return null;
      try {
        // Let a just-changed colour/scale actually draw before capturing the frame.
        await viewer.updateComplete;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // (idealAspect is avoided: it intermittently fails to produce a blob; the box is square anyway.)
        let blob;
        try {
          blob = await viewer.toBlob({ mimeType: 'image/png' });
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 250));
          blob = await viewer.toBlob({ mimeType: 'image/png' });
        }
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#F3EEE6'; // the viewer's cream backdrop; JPEG has no transparency
        ctx.fillRect(0, 0, size, size);
        const side = Math.min(bitmap.width, bitmap.height);
        ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
        const url = canvas.toDataURL('image/jpeg', 0.82);
        // A flat cream square (~2 KB) means the viewer wasn't drawing (scrolled out of view): not a usable thumbnail.
        return url.length < 3500 ? null : url;
      } catch (err) {
        console.warn('3D snapshot failed, using the product photo instead', err);
        return null;
      }
    },
  }));

  const poster = product.images?.[0];

  return (
    <div ref={containerRef} className="relative mx-auto aspect-square max-h-[42vh] w-full overflow-hidden bg-cream md:max-h-none">
      {poster && !loaded && (
        <img src={poster} alt={product.title} className="absolute inset-0 h-full w-full object-cover" />
      )}

      {defined && (
        <model-viewer
          ref={viewerRef}
          src={config.model}
          alt={`3D model of ${product.title}`}
          camera-controls
          auto-rotate={!prefersReducedMotion() || undefined}
          auto-rotate-delay="1500"
          rotation-per-second="18deg"
          shadow-intensity="0.9"
          shadow-softness="1"
          exposure="1.05"
          environment-image="neutral"
          interaction-prompt="none"
          camera-orbit="20deg 78deg auto"
          min-camera-orbit="auto auto 60%"
          max-camera-orbit="auto auto 220%"
          ar
          ar-modes="webxr scene-viewer quick-look"
          style={{ width: '100%', height: '100%', background: 'transparent', opacity: loaded ? 1 : 0, transition: 'opacity 400ms' }}
        >
          <button
            slot="ar-button"
            type="button"
            className="absolute bottom-4 right-4 border border-ink bg-paper/90 px-4 py-2 text-xs uppercase tracking-wide text-ink"
          >
            View in your room
          </button>
        </model-viewer>
      )}

      {!loaded && visible && (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs uppercase tracking-[0.2em] text-stone-600">
          Loading 3D…
        </p>
      )}
      {loaded && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] uppercase tracking-[0.2em] text-stone-600/80">
          Drag to rotate · scroll to zoom
        </p>
      )}
    </div>
  );
});

export default ProductViewer3D;
