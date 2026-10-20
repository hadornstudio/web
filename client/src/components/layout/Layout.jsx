import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LoadingScreen from '../common/LoadingScreen';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

export default function Layout() {
  // The home page ends on a full-width dark banner, so its footer sits flush against it.
  const flushFooter = useLocation().pathname === '/';
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer flush={flushFooter} />
      <CartDrawer />
    </div>
  );
}
