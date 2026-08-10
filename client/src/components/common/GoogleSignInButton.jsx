import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loadGoogleScript } from '../../utils/loadGoogleScript';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Renders nothing if VITE_GOOGLE_CLIENT_ID isn't configured, rather than showing a
// broken/dead button — keeps this safe to always include on Login/Register.
export default function GoogleSignInButton() {
  const containerRef = useRef(null);
  const { googleAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript().then((google) => {
      if (cancelled || !containerRef.current) return;

      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          setError('');
          try {
            await googleAuth(credential);
            navigate(searchParams.get('redirect') || '/account', { state: location.state });
          } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
          }
        },
      });

      google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <div>
      <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-wide text-stone-600">
        <span className="h-px flex-1 bg-stone-300" />
        or
        <span className="h-px flex-1 bg-stone-300" />
      </div>
      <div ref={containerRef} className="mt-4 flex justify-center" />
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
