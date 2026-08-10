import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="container-page flex flex-col items-center justify-center gap-6 py-32 text-center">
      <h1 className="font-display text-4xl">Page Not Found</h1>
      <p className="text-stone-600">The page you're looking for doesn't exist.</p>
      <Button as={Link} to="/">Back to Home</Button>
    </div>
  );
}
