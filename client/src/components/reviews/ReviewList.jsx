import StarRating from '../common/StarRating';
import Badge from '../common/Badge';

export default function ReviewList({ reviews }) {
  if (!reviews?.length) {
    return <p className="text-sm text-stone-600">No reviews yet — be the first to share your thoughts.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {reviews.map((review) => (
        <div key={review._id} className="border-b border-stone-300 pb-8">
          <div className="flex items-center gap-3">
            <StarRating rating={review.rating} />
            {review.isVerifiedPurchase && <Badge tone="success">Verified Purchase</Badge>}
          </div>
          {review.title && <h4 className="mt-2 text-sm text-ink">{review.title}</h4>}
          <p className="mt-2 text-sm text-stone-600">{review.comment}</p>
          <p className="mt-3 text-xs text-stone-600">
            {review.user?.name || 'Hadorn Customer'} · {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
