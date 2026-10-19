import { useEffect } from 'react';
import ScrollFilmHero from '../components/film/ScrollFilmHero';
import LogoIntro from '../components/film/LogoIntro';
import { startLenis, stopLenis } from '../lib/lenisManager';
import { usePageMeta } from '../hooks/usePageMeta';
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
