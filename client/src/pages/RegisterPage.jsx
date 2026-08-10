import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useScrollReveal } from '../hooks/useScrollReveal';
import AuthSplitLayout from '../components/common/AuthSplitLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import GoogleSignInButton from '../components/common/GoogleSignInButton';

const REGISTER_IMAGE = 'https://images.unsplash.com/photo-1659032882718-3e54e7da86ab?q=80&w=1200&auto=format&fit=crop';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { register, registerStatus } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const authMessage = location.state?.authMessage;
  const redirect = searchParams.get('redirect');
  const contentRef = useScrollReveal({ y: 16, stagger: 0.08, scrollTrigger: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate(redirect || '/account', { state: location.state });
    } catch (err) {
      const apiError = err.response?.data;
      setError(apiError?.errors?.[0]?.message || apiError?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthSplitLayout image={REGISTER_IMAGE} imageSide="right">
      <div ref={contentRef}>
        <h1 className="font-display text-3xl">Create an Account</h1>
        <p className="mt-2 text-sm text-stone-600">Save your addresses, track orders, and build a wishlist.</p>

        {authMessage && (
          <p className="mt-4 border border-accent bg-accent-tint px-4 py-2.5 text-sm text-accent-dark">
            {authMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" disabled={registerStatus.isPending} className="mt-2">
            {registerStatus.isPending ? 'Creating Account…' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6">
          <GoogleSignInButton />
        </div>

        <p className="mt-6 text-sm text-stone-600">
          Already have an account?{' '}
          <Link
            to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            state={location.state}
            className="text-accent hover:text-accent-dark"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
