import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gsap } from '../lib/motion/gsapConfig';
import { useGalleryItems } from '../hooks/useGallery';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePageMeta } from '../hooks/usePageMeta';
import { webglAvailable } from '../utils/webgl';
import LoadingScreen from '../components/common/LoadingScreen';
import TitleCard from '../components/showroom/TitleCard';
import LightsOnFilm from '../components/showroom/LightsOnFilm';
import GalleryExperience from '../components/showroom/GalleryExperience';
import ShowroomList from '../components/showroom/ShowroomList';
import { SHOWROOM, toWorks } from '../components/showroom/showroomConfig';

// title card -> "lights on" film -> interactive hall. The hall mounts behind the intro so it is
// ready (shaders compiled, first textures loading) by the time the film crossfades into it.
function Walkthrough({ works, reduced }) {
  const [phase, setPhase] = useState(reduced ? 'gallery' : 'title');
  const [filmMounted, setFilmMounted] = useState(!reduced);
  const [sceneReady, setSceneReady] = useState(false);
  const [filmDone, setFilmDone] = useState(false);
  const filmWrapRef = useRef(null);
  const galleryWrapRef = useRef(null);

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onFilmDone = useCallback(() => setFilmDone(true), []);
  const onTitleDone = useCallback(() => setPhase((p) => (p === 'title' ? 'film' : p)), []);

  useEffect(() => {
    if (filmDone && phase === 'film') {
      const t = setTimeout(() => setPhase('gallery'), sceneReady ? 0 : 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [filmDone, sceneReady, phase]);

  useEffect(() => {
    if (phase !== 'gallery' || !filmMounted) return undefined;
    const d = reduced ? 0 : SHOWROOM.film.crossfadeSec;
    gsap.to(filmWrapRef.current, { autoAlpha: 0, duration: d });
    const t = setTimeout(() => setFilmMounted(false), d * 1000 + 50);
    return () => clearTimeout(t);
  }, [phase, filmMounted, reduced]);

  const intro = phase === 'title' || phase === 'film';

  return (
    <div className="fixed inset-0 overflow-hidden bg-night">
      <div ref={galleryWrapRef} className="absolute inset-0">
        <GalleryExperience works={works} instant={reduced} onReady={onSceneReady} />
      </div>

      {filmMounted && (
        <div ref={filmWrapRef} className="absolute inset-0 z-20">
          {phase !== 'title' && <LightsOnFilm onDone={onFilmDone} />}
          {phase === 'title' && <TitleCard onDone={onTitleDone} />}
        </div>
      )}

      {intro && (
        <button
          type="button"
          onClick={() => setPhase('gallery')}
          className="absolute right-5 top-5 z-40 font-studio text-[11px] uppercase tracking-[0.3em] text-ivory/70 transition-colors hover:text-gold"
        >
          Skip intro
        </button>
      )}

      <ShowroomList works={works} hidden />
    </div>
  );
}

export default function ShowroomPage() {
  usePageMeta({ title: 'The Gallery', description: "Walk through Hadorn Studio's 3D gallery of handcrafted beadwork — every piece with its story." });
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [searchParams] = useSearchParams();
  const forceList = searchParams.get('view') === 'list';
  const { data, isLoading } = useGalleryItems({ sort: 'newest' });
  // The showroom is for the 3D models: once any piece has one, only pieces with a model are hung. Until the first
  // model exists the hall shows the photo works, so it is never empty.
  const works = useMemo(() => {
    const all = toWorks(data?.data?.items);
    const withModels = all.filter((w) => w.model);
    return withModels.length ? withModels : all;
  }, [data]);
  const [hasWebgl] = useState(webglAvailable);
  const [enter3D, setEnter3D] = useState(false);

  if (isLoading) return <LoadingScreen fullscreen />;

  if (works.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-2xl">The gallery is being hung.</p>
        <p className="mt-3 text-stone-600">Check back soon — meanwhile, <Link to="/shop" className="text-accent">browse the shop</Link>.</p>
      </div>
    );
  }

  const use3D = hasWebgl && !forceList && (!reduced || enter3D);
  if (use3D) return <Walkthrough works={works} reduced={reduced} />;

  const notice = !hasWebgl
    ? "Your browser can't show the 3D gallery, so here are the pieces as a list."
    : reduced
      ? 'Motion is reduced on your device, so the gallery opens as a list.'
      : undefined;
  return (
    <div className="min-h-screen bg-paper">
      <ShowroomList works={works} notice={notice} onEnter3D={hasWebgl && reduced && !forceList ? () => setEnter3D(true) : undefined} />
    </div>
  );
}
