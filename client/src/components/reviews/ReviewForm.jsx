import { useState } from 'react';
import { useCreateReview } from '../../hooks/useReviews';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../common/Button';
import { Link } from 'react-router-dom';

export default function ReviewForm({ productId }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const mutation = useCreateReview(productId);

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-stone-600">
        <Link to="/login" className="text-accent hover:text-accent-dark">Sign in</Link> to leave a review.
      </p>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({ rating, title, comment });
      setTitle('');
      setComment('');
      setRating(5);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review.');
    }
  };

  if (mutation.isSuccess) {
    return <p className="text-sm text-success">Thank you — your review has been posted.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-xl ${n <= rating ? 'text-accent' : 'text-stone-300'}`}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-stone-300 bg-paper px-4 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <textarea
        placeholder="Share your thoughts on this piece…"
        required
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="border border-stone-300 bg-paper px-4 py-2 text-sm focus:border-accent focus:outline-none"
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" variant="secondary" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? 'Submitting…' : 'Submit Review'}
      </Button>
    </form>
  );
}
