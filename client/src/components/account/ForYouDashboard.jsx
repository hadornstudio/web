import { useAuthStore } from '../../store/useAuthStore';
import { useRecommendations } from '../../hooks/useUsers';
import PreferencePicker from './PreferencePicker';
import ProductGrid from '../product/ProductGrid';
import Spinner from '../common/Spinner';

export default function ForYouDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useRecommendations();

  const showOnboarding = !user?.preferences?.onboarded;

  return (
    <div className="flex flex-col gap-12">
      {showOnboarding && <PreferencePicker />}

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div>
            <h2 className="font-display text-2xl">
              {data?.personalized ? 'Picked for You' : 'Popular Right Now'}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {data?.personalized
                ? 'Based on your preferences, wishlist, and past orders.'
                : "A broad mix to start — this narrows in as we learn what you like."}
            </p>
            <div className="mt-6">
              <ProductGrid products={data?.pickedForYou} />
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl">Discover Something New</h2>
            <p className="mt-1 text-sm text-stone-600">
              Outside your usual picks — worth a look.
            </p>
            <div className="mt-6">
              <ProductGrid products={data?.discover} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
