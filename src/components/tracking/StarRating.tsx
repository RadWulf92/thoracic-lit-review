interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, onChange, size = 'sm' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label="Paper rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(rating === star ? 0 : star)}
          className="text-gray-300 hover:text-amber-400 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <svg
            className={`${sizeClass} ${star <= rating ? 'text-amber-400 fill-amber-400' : 'fill-none'}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
