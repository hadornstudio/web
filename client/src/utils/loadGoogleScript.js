let googlePromise;

export function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googlePromise) return googlePromise;

  googlePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return googlePromise;
}
