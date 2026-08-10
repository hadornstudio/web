import { useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useAuthStore } from '../store/useAuthStore';
import { usersApi } from '../api/users';
import { gsap, EASE, DURATION, prefersReducedMotion } from '../lib/motion/gsapConfig';
import AccountSidebar from '../components/account/AccountSidebar';
import ForYouDashboard from '../components/account/ForYouDashboard';
import OrderHistoryList from '../components/account/OrderHistoryList';
import AddressBook from '../components/account/AddressBook';
import WishlistGrid from '../components/account/WishlistGrid';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

function ProfileSection() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await usersApi.updateProfile(form);
    updateUser(res.data.user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="Email" value={user?.email} disabled className="opacity-60" />
      <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <Button type="submit" className="self-start">{saved ? 'Saved ✓' : 'Save Changes'}</Button>
    </form>
  );
}

export default function AccountDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const contentRef = useRef(null);

  useGSAP(
    () => {
      if (!contentRef.current || prefersReducedMotion()) return;
      gsap.fromTo(
        contentRef.current,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: DURATION.fast, ease: EASE.hover }
      );
    },
    { dependencies: [location.pathname], scope: contentRef }
  );

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="container-page py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-600">My Account</p>
      <h1 className="mt-3 font-display text-4xl">Welcome back{firstName ? `, ${firstName}` : ''}.</h1>
      <div className="mt-4 h-px w-16 bg-accent" />

      <div className="mt-12 flex flex-col gap-12 md:flex-row">
        <AccountSidebar />

        <div ref={contentRef} className="flex-1">
          <Routes>
            <Route index element={<ForYouDashboard />} />
            <Route path="profile" element={<ProfileSection />} />
            <Route path="orders" element={<OrderHistoryList />} />
            <Route path="addresses" element={<AddressBook />} />
            <Route path="wishlist" element={<WishlistGrid />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
