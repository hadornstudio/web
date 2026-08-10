import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useScrollReveal } from '../hooks/useScrollReveal';
import AuthSplitLayout from '../components/common/AuthSplitLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const LOGIN_IMAGE = 'https://images.unsplash.com/photo-1611170947204-5ab96c3e37a1?q=80&w=1200&auto=format&fit=crop';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, loginStatus } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contentRef = useScrollReveal({ y: 16, stagger: 0.08, scrollTrigger: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form);
      navigate(searchParams.get('redirect') || '/account');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthSplitLayout image={LOGIN_IMAGE} imageSide="left">
      <div ref={contentRef}>
        <h1 className="font-display text-3xl">Welcome Back</h1>
        <p className="mt-2 text-sm text-stone-600">Sign in to view your orders, wishlist, and saved addresses.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" disabled={loginStatus.isPending} className="mt-2">
            {loginStatus.isPending ? 'Signing In…' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-stone-600">
          New to Hadorn?{' '}
          <Link to="/register" className="text-accent hover:text-accent-dark">
            Create an account
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
