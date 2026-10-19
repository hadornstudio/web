import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Spinner from '../common/Spinner';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-[60vh]"><Spinner className="py-32" /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
