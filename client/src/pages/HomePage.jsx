import { useEffect } from 'react';
import ScrollFilmHero from '../components/film/ScrollFilmHero';
import LogoIntro from '../components/film/LogoIntro';
import { startLenis, stopLenis } from '../lib/lenisManager';
import { usePageMeta } from '../hooks/usePageMeta';
import { ScrollTrigger } from '../lib/motion/gsapConfig';
import ShopByCollection from '../components/home/ShopByCollection';
import BestsellersGrid from '../components/home/BestsellersGrid';
import CraftStory from '../components/home/CraftStory';
import FabricBeading from '../components/home/FabricBeading';
import Testimonials from '../components/home/Testimonials';
import NewsletterCTA from '../components/home/NewsletterCTA';
import AdSlot from '../components/common/AdSlot';

export default function HomePage() {
  usePageMeta();
  // Smooth scrolling is scoped to the home page; everything else keeps native scroll.
  useEffect(() => {
    startLenis();
    return stopLenis;
  }, []);

  // Late-arriving content (fonts, lazy images, data-driven sections) shifts the page after the scroll effects
  // measured it, so re-measure once things settle.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    const timers = [setTimeout(refresh, 600), setTimeout(refresh, 2000)];
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('load', refresh);
    };
  }, []);

  return (
    <div>
      <LogoIntro />
      <ScrollFilmHero />
      <ShopByCollection />
      <div className="container-page py-12">
        <AdSlot placement="homepage-banner" />
      </div>
      <BestsellersGrid />
      <CraftStory />
      <FabricBeading />
      <Testimonials />
      <NewsletterCTA />
    </div>
  );
}
