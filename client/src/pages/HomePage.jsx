import Hero from '../components/home/Hero';
import ShopByCollection from '../components/home/ShopByCollection';
import BestsellersGrid from '../components/home/BestsellersGrid';
import CraftStory from '../components/home/CraftStory';
import FabricBeading from '../components/home/FabricBeading';
import Testimonials from '../components/home/Testimonials';
import NewsletterCTA from '../components/home/NewsletterCTA';
import AdSlot from '../components/common/AdSlot';

export default function HomePage() {
  return (
    <div>
      <Hero />
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
